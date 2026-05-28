import requests
import sys
import json
from datetime import datetime

class NaijaLMSAPITester:
    def __init__(self, base_url="https://naija-lms.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

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

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_student_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!",
            "full_name": "Test Student"
        }
        
        response = self.run_test("User Registration", "POST", "auth/register", 200, test_user_data)
        if response and 'access_token' in response:
            self.token = response['access_token']
            self.test_user_email = test_user_data['email']
            return True
        return False

    def test_user_login(self):
        """Test user login with registered user"""
        if not hasattr(self, 'test_user_email'):
            self.log_test("User Login", False, "No registered user available")
            return False
            
        login_data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        
        response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if response and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.token:
            self.log_test("Get Current User", False, "No authentication token")
            return False
            
        return self.run_test("Get Current User", "GET", "auth/me", 200) is not None

    def test_get_courses(self):
        """Test get all courses"""
        response = self.run_test("Get All Courses", "GET", "courses", 200)
        return response is not None

    def test_get_single_course(self):
        """Test get single course (if courses exist)"""
        # First get all courses
        courses_response = self.run_test("Get Courses for Single Test", "GET", "courses", 200)
        if courses_response and len(courses_response) > 0:
            course_id = courses_response[0]['id']
            return self.run_test("Get Single Course", "GET", f"courses/{course_id}", 200) is not None
        else:
            self.log_test("Get Single Course", False, "No courses available to test")
            return False

    def test_contact_form(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "This is a test message"
        }
        
        return self.run_test("Contact Form Submission", "POST", "contact", 200, contact_data) is not None

    def test_bank_settings(self):
        """Test get bank settings"""
        return self.run_test("Get Bank Settings", "GET", "settings/bank", 200) is not None

    def test_my_enrollments(self):
        """Test get my enrollments (requires auth)"""
        if not self.token:
            self.log_test("Get My Enrollments", False, "No authentication token")
            return False
            
        return self.run_test("Get My Enrollments", "GET", "enrollments/my", 200) is not None

    def test_my_payments(self):
        """Test get my payments (requires auth)"""
        if not self.token:
            self.log_test("Get My Payments", False, "No authentication token")
            return False
            
        return self.run_test("Get My Payments", "GET", "payments/my", 200) is not None

    def test_unauthorized_admin_access(self):
        """Test that regular users can't access admin endpoints"""
        if not self.token:
            self.log_test("Unauthorized Admin Access", False, "No authentication token")
            return False
            
        # Should return 403 for non-admin users
        response = self.run_test("Admin Access Control", "GET", "admin/stats", 403)
        return response is None  # We expect this to fail with 403

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Naija LMS Backend API Tests")
        print("=" * 50)
        
        # Test basic endpoints
        self.test_root_endpoint()
        
        # Test authentication flow
        if self.test_user_registration():
            self.test_get_current_user()
            self.test_user_login()
        
        # Test public endpoints
        self.test_get_courses()
        self.test_get_single_course()
        self.test_contact_form()
        self.test_bank_settings()
        
        # Test authenticated endpoints
        self.test_my_enrollments()
        self.test_my_payments()
        
        # Test security
        self.test_unauthorized_admin_access()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test_name']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = NaijaLMSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())