-- Clean up orphaned document assignments for deleted user
DELETE FROM document_assignments WHERE user_id = '9a1ba326-448a-4301-bede-6bb8a151dea9';