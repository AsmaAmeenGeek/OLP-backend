const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Public routes
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes for instructor only
router.post('/', auth, requireRole('instructor'), courseController.createCourse);
router.put('/:id', auth, requireRole('instructor'), courseController.updateCourse);
router.delete('/:id', auth, requireRole('instructor'), courseController.deleteCourse);
router.get('/:id/students', auth, requireRole('instructor'), courseController.getEnrolledStudents);

// Protected routes for student only
router.post('/:id/enroll', auth, requireRole('student'), courseController.enrollCourse);

module.exports = router;