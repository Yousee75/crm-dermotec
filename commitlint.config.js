module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nouvelle fonctionnalité
        'fix',      // Correction de bug
        'docs',     // Documentation
        'style',    // Formatage (pas de changement de code)
        'refactor', // Refactoring
        'perf',     // Performance
        'test',     // Tests
        'build',    // Build system
        'ci',       // CI/CD
        'chore',    // Maintenance
        'revert',   // Revert
        'db',       // Migrations DB
        'security', // Sécurité
      ],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
}
