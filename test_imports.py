import sys
sys.path.insert(0, '.')
try:
    from backend.app.main import app
    print("Backend imports OK")
except Exception as e:
    print(f"Import error: {e}")
    import traceback
    traceback.print_exc()
