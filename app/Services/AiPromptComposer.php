<?php

namespace App\Services;

class AiPromptComposer
{
    private int $maxItems = 6;
    private int $maxItemChars = 280;
    private int $maxContextChars = 1800;
    private int $maxExplainSources = 8;
    private int $maxAlertItems = 6;

    private bool $explainMode = false;
    private array $alerts = [];
    private string $defaultFormat = 'decision';

    private array $forbiddenPatterns = [
        '/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i',
        '/\\b\\+?\\d[\\d\\s().-]{6,}\\b/',
    ];

    public function compose(array $profile, array $documents, string $question): string
    {
        $system = $this->buildSystemContext($profile);
        $context = $this->buildContext($documents);
        if (($profile['key'] ?? '') === 'admin' && $context !== '') {
            $context = "School stats:\n{$context}";
        }
        $limitations = $this->buildLimitations($documents, $context);
        $user = $this->buildUserQuestion($question);
        $alerts = $this->consumeAlerts();
        $format = $this->detectFormat($question);

        $sections = [
            "SYSTEM CONTEXT:\n{$system}",
            "DATA CONTEXT:\n".($context !== '' ? $context : '(no authorized data)'),
        ];

        if (! empty($alerts)) {
            $sections[] = $this->buildAlertsSection($profile, $alerts);
        }

        if ($limitations !== '') {
            $sections[] = $limitations;
        }

        $sections[] = $this->buildOutputFormatSection($format, $profile);
        $sections[] = "USER QUESTION:\n{$user}";

        if ($this->explainMode) {
            $sections[] = $this->buildExplainSection($profile, $documents, $context);
        }

        return implode("\n\n", $sections);
    }

    public function enableExplainMode(bool $enabled = true): void
    {
        $this->explainMode = $enabled;
    }

    public function setAlerts(array $alerts): void
    {
        $this->alerts = $alerts;
    }

    private function buildSystemContext(array $profile): string
    {
        $rules = implode(' ', array_map(fn ($item) => "- {$item}", $profile['access_rules'] ?? []));
        $style = implode(' ', array_map(fn ($item) => "- {$item}", $profile['style'] ?? []));

        return implode("\n", array_filter([
            "You are {$profile['name']} ({$profile['role']}).",
            $rules !== '' ? "Rules: {$rules}" : null,
            $style !== '' ? "Style: {$style}" : null,
            "Use only the provided data context. If data is missing, explain the limitation.",
            "Return only necessary information and keep the answer decision-oriented.",
            "Write in clear, natural French with structured sections.",
        ]));
    }

    private function buildContext(array $documents): string
    {
        if (! $documents) {
            return '';
        }

        $items = [];
        $totalChars = 0;
        $omitted = 0;

        foreach ($documents as $doc) {
            $text = trim((string) ($doc->document_text ?? ''));
            if ($text === '') {
                continue;
            }

            $clean = $this->redactForbidden($text);
            $clean = $this->truncate($clean, $this->maxItemChars);

            if (in_array($clean, $items, true)) {
                continue;
            }

            $nextTotal = $totalChars + strlen($clean);
            if (count($items) >= $this->maxItems || $nextTotal > $this->maxContextChars) {
                $omitted++;
                continue;
            }

            $items[] = $clean;
            $totalChars = $nextTotal;
        }

        $lines = array_map(fn ($item) => "- {$item}", $items);
        if ($omitted > 0) {
            $lines[] = "- [summary] {$omitted} more items omitted to stay within context limits.";
        }

        return implode("\n", $lines);
    }

    private function buildLimitations(array $documents, string $context): string
    {
        if (! $documents) {
            return "LIMITATIONS:\n- No authorized data available for this request.";
        }

        $limited = count($documents) > $this->maxItems || strlen($context) >= $this->maxContextChars;
        if (! $limited) {
            return '';
        }

        return "LIMITATIONS:\n- Dataset summarized due to size; request a narrower scope for more detail.";
    }

    private function buildUserQuestion(string $question): string
    {
        $clean = trim($question);
        $clean = $this->redactForbidden($clean);

        if ($clean === '') {
            return '(empty question)';
        }

        return $clean;
    }

    private function redactForbidden(string $text): string
    {
        $redacted = $text;
        foreach ($this->forbiddenPatterns as $pattern) {
            $redacted = preg_replace($pattern, '[redacted]', $redacted) ?? $redacted;
        }

        return $redacted;
    }

    private function truncate(string $text, int $maxChars): string
    {
        if (strlen($text) <= $maxChars) {
            return $text;
        }

        return substr($text, 0, $maxChars - 3).'...';
    }

    private function buildExplainSection(array $profile, array $documents, string $context): string
    {
        $sources = $this->summarizeSources($documents);
        $rules = implode(' ', array_map(fn ($item) => "- {$item}", $profile['access_rules'] ?? []));

        $lines = [
            "EXPLAIN MODE:",
            "Agent: {$profile['name']} ({$profile['role']}).",
            $rules !== '' ? "Applied rules: {$rules}" : "Applied rules: (none)",
            "Sources: ".($sources !== '' ? $sources : 'none'),
        ];

        if ($context === '') {
            $lines[] = "Notes: no authorized data in context.";
        }

        return implode("\n", $lines);
    }

    private function summarizeSources(array $documents): string
    {
        if (! $documents) {
            return '';
        }

        $items = [];
        foreach ($documents as $doc) {
            $type = $doc->document_type ?? null;
            $table = $doc->source_table ?? null;
            $id = $doc->source_id ?? null;

            if (! $type || ! $table) {
                continue;
            }

            $label = "{$table}#".($id ?? 'n/a')." ({$type})";
            if (! in_array($label, $items, true)) {
                $items[] = $label;
            }

            if (count($items) >= $this->maxExplainSources) {
                break;
            }
        }

        return implode('; ', $items);
    }

    private function consumeAlerts(): array
    {
        $alerts = $this->alerts;
        $this->alerts = [];

        return $alerts;
    }

    private function detectFormat(string $question): string
    {
        $text = strtolower($question);
        $explicit = $this->detectExplicitFormat($text);
        if ($explicit !== '') {
            return $explicit;
        }

        $formats = [
            'tableau' => '/\\btableau\\b|\\btable\\b/',
            'decision' => '/\\bdecision\\b|\\brecommandation\\b|\\brecommande\\b/',
            'actions' => '/\\bactions?\\b|\\bplan\\b/',
            'court' => '/\\bcourt\\b|\\bresume\\b|\\bsynthese\\b/',
        ];

        foreach ($formats as $format => $pattern) {
            if (preg_match($pattern, $text)) {
                return $format;
            }
        }

        return '';
    }

    private function detectExplicitFormat(string $text): string
    {
        if (preg_match('/\\bformat\\s*[:=]?\\s*(court|tableau|decision|actions?)\\b/', $text, $matches)) {
            return $matches[1] === 'actions' ? 'actions' : $matches[1];
        }

        if (preg_match('/\\ben\\s+(court|tableau|decision|actions?)\\b/', $text, $matches)) {
            return $matches[1] === 'actions' ? 'actions' : $matches[1];
        }

        return '';
    }

    private function buildOutputFormatSection(string $format, array $profile): string
    {
        $defaultFormat = $this->defaultFormatForRole($profile);
        $formatLabel = $format !== '' ? $format : $defaultFormat;

        $lines = [
            "OUTPUT FORMAT:",
            "Language: Francais.",
            "Requested: {$formatLabel}.",
            "Default by role: {$defaultFormat}.",
            "If no format is explicitly requested, follow the default and start with a clear decision.",
            "Formats:",
            "- court: 3-5 bullets, concise.",
            "- tableau: markdown table with key metrics and risks.",
            "- decision: recommendation first, then rationale and actions.",
            "- actions: numbered action plan, 3-6 steps.",
        ];

        return implode("\n", $lines);
    }

    private function defaultFormatForRole(array $profile): string
    {
        $key = (string) ($profile['key'] ?? '');

        return match ($key) {
            'admin' => 'decision',
            'accountant' => 'tableau',
            'teacher' => 'actions',
            'student' => 'court',
            'parent' => 'actions',
            default => $this->defaultFormat,
        };
    }

    private function buildAlertsSection(array $profile, array $alerts): string
    {
        $lines = [];
        $omitted = 0;

        foreach ($alerts as $alert) {
            if (count($lines) >= $this->maxAlertItems) {
                $omitted++;
                continue;
            }

            $message = $this->formatAlert($profile, $alert);
            if (! $message) {
                continue;
            }

            $lines[] = "- {$message}";
        }

        if ($omitted > 0) {
            $lines[] = "- [summary] {$omitted} more alerts omitted.";
        }

        return "ALERTS:\n".implode("\n", $lines);
    }

    private function formatAlert(array $profile, array $alert): ?string
    {
        $rule = (string) ($alert['rule'] ?? '');
        $data = $alert['data'] ?? [];
        $severity = $alert['severity'] ?? 'info';

        $message = match ($rule) {
            'admin.absence_spike' => "Absences elevees: {$data['count']} absences sur {$data['window_days']} jours.",
            'admin.overdue_payments' => "Paiements en retard: {$data['count']} enregistrements.",
            'admin.cashflow_negative' => "Tresorerie negative: depenses {$data['expenses']} vs paiements {$data['payments']} (sur {$data['window_days']} jours).",
            'accountant.overdue_payments' => "Paiements en retard: {$data['count']} enregistrements.",
            'accountant.cashflow_negative' => "Tresorerie negative: depenses {$data['expenses']} vs paiements {$data['payments']} (sur {$data['window_days']} jours).",
            'teacher.low_averages' => $this->formatListAlert(
                "Eleves sous {$data['threshold']} de moyenne",
                $data['count'] ?? 0,
                $data['names'] ?? []
            ),
            'teacher.absence_spike' => $this->formatListAlert(
                "Absences elevees ({$data['window_days']} jours, seuil {$data['threshold']})",
                $data['count'] ?? 0,
                $data['names'] ?? []
            ),
            'student.low_average' => "Moyenne faible: {$data['average']} (seuil {$data['threshold']}).",
            'student.recent_absences' => "Absences recentes: {$data['count']} sur {$data['window_days']} jours.",
            'student.payment_overdue' => "Paiements en retard: {$data['count']} enregistrements.",
            'parent.low_averages' => $this->formatListAlert(
                "Enfants sous {$data['threshold']} de moyenne",
                $data['count'] ?? 0,
                $data['names'] ?? []
            ),
            'parent.recent_absences' => $this->formatListAlert(
                "Absences elevees ({$data['window_days']} jours, seuil {$data['threshold']})",
                $data['count'] ?? 0,
                $data['names'] ?? []
            ),
            default => '',
        };

        if ($message === '') {
            return null;
        }

        $clean = $this->redactForbidden($message);

        return strtoupper((string) $severity).": {$clean}";
    }

    private function formatListAlert(string $title, int $count, array $names): string
    {
        $sample = '';
        if (! empty($names)) {
            $sample = ' Exemple: '.implode(', ', array_slice($names, 0, 3)).'.';
        }

        return "{$title} ({$count}).{$sample}";
    }
}
