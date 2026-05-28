import requests
import sys
from datetime import datetime

class AdminAPITester:
    def __init__(self, base_url="https://naija-lms.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        admin_credentials = {
            "email": "admin@naijalms.com",
            "password": "Admin123!"
        }
        
        response = self.run_test("Admin Login", "POST", "auth/login", 200, admin_credentials)
        if response and 'access_token' in response:
            self.admin_token = response['access_token']
            user_data = response.get('user', {})
            if user_data.get('role') == 'admin':
                print(f"    Admin user: {user_data.get('email')} - {user_data.get('full_name')}")
                return True
            else:
                self.log_test("Admin Role Verification", False, f"User role is {user_data.get('role')}, expected admin")
        return False

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        if not self.admin_token:
            self.log_test("Admin Endpoints", False, "No admin token available")
            return False
        
        # Test admin stats
        self.run_test("Admin Stats", "GET", "admin/stats", 200)
        
        # Test admin courses
        self.run_test("Admin Courses", "GET", "admin/courses", 200)
        
        # Test admin payments
        self.run_test("Admin Payments", "GET", "admin/payments", 200)
        
        # Test admin students
        self.run_test("Admin Students", "GET", "admin/students", 200)
        
        # Test admin settings
        self.run_test("Admin Bank Settings Update", "PUT", "admin/settings/bank", 200, {
            "bank_name": "Test Bank",
            "account_number": "1234567890",
            "account_name": "Test Account"
        })

    def run_all_tests(self):
        """Run all admin tests"""
        print("🔐 Starting Admin API Tests")
        print("=" * 40)
        
        if self.test_admin_login():
            self.test_admin_endpoints()
        
        # Print summary
        print("\n" + "=" * 40)
        print(f"📊 Admin Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AdminAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())