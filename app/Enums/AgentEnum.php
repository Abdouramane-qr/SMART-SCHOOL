<?php

namespace App\Enums;

enum AgentEnum: string
{
    case ADMIN = 'admin';
    case ACCOUNTANT = 'accountant';
    case TEACHER = 'teacher';
    case STUDENT = 'student';
    case PARENT = 'parent';

    public static function fromRole(?string $role): ?self
    {
        if (! $role) {
            return null;
        }

        $normalized = strtolower(trim($role));

        return match ($normalized) {
            'super_admin', 'admin', 'admin_ecole' => self::ADMIN,
            'comptable' => self::ACCOUNTANT,
            'enseignant' => self::TEACHER,
            'eleve' => self::STUDENT,
            'parent' => self::PARENT,
            default => self::tryFrom($normalized),
        };
    }
}
