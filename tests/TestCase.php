<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        if (! extension_loaded('pdo_pgsql')) {
            $this->markTestSkipped('pdo_pgsql extension not available for tests.');
        }

        parent::setUp();
    }
}
