import sqlite3

def update_schema():
    conn = sqlite3.connect('scholarship_system.db')
    cursor = conn.cursor()
    cursor.execute('PRAGMA table_info(applications)')
    cols = [r[1] for r in cursor.fetchall()]
    print('Existing cols:', cols)

    new_cols = [
        ('reviewed_at', 'DATETIME'),
        ('reviewed_by', 'INTEGER'),
        ('decision_remarks', 'TEXT'),
        ('award_status', "VARCHAR(30) DEFAULT 'PENDING'"),
        ('disbursed_at', 'DATETIME'),
        ('disbursement_reference', 'VARCHAR(100)')
    ]

    for col_name, col_type in new_cols:
        if col_name not in cols:
            cursor.execute(f'ALTER TABLE applications ADD COLUMN {col_name} {col_type}')
            print(f'Added column {col_name}')
        else:
            print(f'Column {col_name} already exists')

    cursor.execute("UPDATE applications SET award_status = 'APPROVED' WHERE status = 'APPROVED' AND (award_status IS NULL OR award_status = 'PENDING')")
    print(f'Updated {cursor.rowcount} approved applications to award_status=APPROVED')

    conn.commit()
    cursor.execute('PRAGMA table_info(applications)')
    print('\nFinal columns:')
    for row in cursor.fetchall():
        print(row)
    conn.close()

if __name__ == '__main__':
    update_schema()
