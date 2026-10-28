import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Card, CardContent } from '../../components/ui/card';
import { adminAPI, coursesAPI } from '../../services/api';
import { Users, BookOpen, Mail, Trash2, Ban, CheckCircle, CalendarDays } from 'lucide-react';


const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // track per user
  const [message, setMessage] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEnrollmentStudent, setSelectedEnrollmentStudent] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [savingEnrollmentId, setSavingEnrollmentId] = useState(null);

  // 🔄 Fetch students
  const fetchStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to fetch students' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const formatDate = (date) =>
    !date ? "—" :
    new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

 const fetchCourses = async () => {
    try {
      const res = await coursesAPI.getAll(); // Fetch all courses
      console.log("Courses:", res.data);
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses", err);
      setMessage({
        type: "error",
        text: "Failed to load courses.",
      });
    }
  };
  const openAssignModal = (user) => {
    setSelectedUser(user);
    setSelectedCourse("");
    setShowModal(true);
  };
  
  const handleAssignCourse = async () => {
    if (!selectedCourse) return alert("Select a course");

    try {
      await adminAPI.enrollUser({
        user_id: selectedUser.id,
        course_id: selectedCourse,
      });

      setMessage({ type: "success", text: "Course assigned successfully" });
      await fetchStudents();
      setShowModal(false);
      setSelectedCourse("");
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Failed to assign" });
    }
  };

    // 🔥 DELETE USER (Optimistic UI)
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;

    setActionLoading(id);

    const previous = students;
    setStudents(prev => prev.filter(s => s.id !== id));

    try {
      await adminAPI.deleteUser(id);
      setMessage({ type: 'success', text: 'User deleted successfully' });
    } catch (err) {
      setStudents(previous); // rollback
      setMessage({ type: 'error', text: 'Delete failed' });
    } finally {
      setActionLoading(null);
    }
  };

  // 🔥 TOGGLE BLOCK (Optimistic)
  const handleToggleBlock = async (student) => {
    setActionLoading(student.id);

    const updatedStudents = students.map(s =>
      s.id === student.id
        ? { ...s, is_blocked: !s.is_blocked }
        : s
    );

    setStudents(updatedStudents);

    try {
      if (student.is_blocked) {
        await adminAPI.unblockUser(student.id);
        setMessage({ type: 'success', text: 'User unblocked' });
      } else {
        await adminAPI.blockUser(student.id);
        setMessage({ type: 'success', text: 'User blocked' });
      }
    } catch (err) {
      // rollback
      setStudents(students);
      setMessage({ type: 'error', text: 'Action failed' });
    } finally {
      setActionLoading(null);
    }
  };


  const filteredStudents = students.filter((student) =>
  `${student.full_name} ${student.email}`
    .toLowerCase()
    .includes(search.toLowerCase())
  );

  const openEnrollmentModal = async (student) => {
    setSelectedEnrollmentStudent(student);
    setStudentEnrollments([]);
    setEnrollmentsLoading(true);
  
    try {
      const response = await adminAPI.getStudentEnrollments(student.id);
  
      setStudentEnrollments(response.data);
    } catch (error) {
      console.error("Failed to load enrollments:", error);
      setMessage({ type: "error", text: "Unable to load student enrollments." });
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const saveEnrollmentDate = async (enrollment) => {
    try {
      setSavingEnrollmentId(enrollment.id);
  
      await adminAPI.updateEnrollmentDate(enrollment.id, {
        enrollment_date: enrollment.enrollment_date.slice(0, 10),
      });
  
      setMessage({ type: "success", text: "Enrollment date updated successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.detail || "Failed to update enrollment date.",
      });
    } finally {
      setSavingEnrollmentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className="ml-64 p-8">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            {students.length} student{students.length !== 1 && 's'}
          </p>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-4 p-3 rounded text-white ${
              message.type === 'success'
                ? 'bg-green-500'
                : 'bg-red-500'
            }`}
          >
            {message.text}
          </div>
        )}


        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-3 rounded w-full mb-4"
        />
        
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">Loading students...</div>
            ) : filteredStudents.length > 0 ? (
              <div className="divide-y">
                
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-muted/30"
                  >
                    {/* LEFT */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>

                      <div>
                        <h3 className="font-medium">
                          {student.full_name}
                        </h3>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </span>

                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {student.enrollment_count ?? 0} courses
                          </span>
                        </div>

                        {student.is_blocked && (
                          <span className="text-xs text-red-500 font-semibold">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-sm text-muted-foreground text-right">
                        <p>Joined</p>
                        <p>{formatDate(student.created_at)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">

                        {/* BLOCK / UNBLOCK */}
                        <button
                          disabled={actionLoading === student.id}
                          onClick={() => handleToggleBlock(student)}
                          className={`px-3 py-1 rounded text-white flex items-center gap-1 ${
                            student.is_blocked
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-yellow-500 hover:bg-yellow-600'
                          }`}
                        >
                          {student.is_blocked ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Unblock
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4" />
                              Block
                            </>
                          )}
                        </button>

                        {/* DELETE */}
                        <button
                          disabled={actionLoading === student.id}
                          onClick={() => handleDelete(student.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>

                        <button
                          onClick={() => openAssignModal(student)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                         Assign Course
                        </button>

                        <button
                          onClick={() => openEnrollmentModal(student)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded flex items-center gap-1"
                        >
                          <CalendarDays className="w-4 h-4" />
                          Manage Enrollments
                        </button>

                      </div>
                    </div>
                  </div>
                ))}

              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold">No Students Yet</h3>
                <p className="text-muted-foreground">
                  Students will appear here after registration
                </p>
              </div>
            )}
          </CardContent>
        </Card>
            

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">

              <h2 className="text-xl font-bold mb-4">
                Assign Course to {selectedUser?.full_name}
              </h2>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border p-3 rounded mb-4"
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAssignCourse}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Assign
                </button>
              </div>

            </div>
          </div>
        )}

        {selectedEnrollmentStudent && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold">
                    Manage Enrollments
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedEnrollmentStudent.full_name}
                  </p>
                </div>
        
                <button
                  onClick={() => setSelectedEnrollmentStudent(null)}
                  className="text-gray-500 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
        
              {enrollmentsLoading ? (
                <p>Loading enrollments...</p>
              ) : studentEnrollments.length === 0 ? (
                <p className="text-gray-500">
                  This student has no course enrollments.
                </p>
              ) : (
                <div className="space-y-4">
                  {studentEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <h3 className="font-semibold">
                        {enrollment.course_title}
                      </h3>
        
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Enrollment Date
                        </label>
        
                        <input
                          type="date"
                          value={
                            enrollment.enrollment_date
                              ? enrollment.enrollment_date.slice(0, 10)
                              : ""
                          }
                          onChange={(e) => {
                            setStudentEnrollments((prev) =>
                              prev.map((item) =>
                                item.id === enrollment.id
                                  ? {
                                      ...item,
                                      enrollment_date: e.target.value,
                                    }
                                  : item
                              )
                            );
                          }}
                          className="border rounded-md px-3 py-2 w-full"
                        />
                      </div>
        
                      <button
                        onClick={() => saveEnrollmentDate(enrollment)}
                        disabled={
                          savingEnrollmentId === enrollment.id ||
                          !enrollment.enrollment_date
                        }
                        className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-md disabled:opacity-50"
                      >
                        {savingEnrollmentId === enrollment.id
                          ? "Saving..."
                          : "Save Enrollment Date"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default AdminStudents;
