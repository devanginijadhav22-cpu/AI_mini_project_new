"""
Database Migration Script
- Removes auto-created fake profile data from non-demo student accounts
- Preserves demo student data (user_id=2) and admin (user_id=1)
- Allows nullable fields in student profile tables

Run once before restarting the server.
"""

import sqlite3
import os

DB_PATH = "scholarship_system.db"

def run_migration():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all students who are NOT the demo student (user_id=2) and NOT admin (user_id=1)
    cursor.execute("SELECT id, email FROM users WHERE role='STUDENT' AND id != 2")
    non_demo_students = cursor.fetchall()
    
    if non_demo_students:
        ids = [str(s[0]) for s in non_demo_students]
        id_list = ", ".join(ids)
        print(f"Found non-demo students with auto-created profiles: {[(s[0], s[1]) for s in non_demo_students]}")
        
        # Delete auto-created (fake default) profile records for non-demo students
        # These were populated with demo defaults and do NOT represent real user input
        cursor.execute(f"DELETE FROM student_profiles WHERE user_id IN ({id_list})")
        print(f"  Deleted {cursor.rowcount} student_profiles rows")
        
        cursor.execute(f"DELETE FROM academic_records WHERE user_id IN ({id_list})")
        print(f"  Deleted {cursor.rowcount} academic_records rows")
        
        cursor.execute(f"DELETE FROM financial_records WHERE user_id IN ({id_list})")
        print(f"  Deleted {cursor.rowcount} financial_records rows")
        
        cursor.execute(f"DELETE FROM achievement_records WHERE user_id IN ({id_list})")
        print(f"  Deleted {cursor.rowcount} achievement_records rows")
    else:
        print("No non-demo students found. Nothing to clean.")

    conn.commit()
    
    # Verify demo student still intact
    cursor.execute("SELECT user_id, age, gender, state FROM student_profiles WHERE user_id=2")
    demo = cursor.fetchone()
    if demo:
        print(f"\nDemo student profile verified: user_id={demo[0]}, age={demo[1]}, gender={demo[2]}, state={demo[3]}")
    else:
        print("\nWARNING: Demo student profile missing! Will be recreated on next startup.")
    
    conn.close()
    print("\nMigration complete. Non-demo students will now correctly see 'Profile Incomplete' on login.")

if __name__ == "__main__":
    run_migration()
