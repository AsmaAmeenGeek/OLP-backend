const Course = require('../models/Course');

// Create course for instructor only
exports.createCourse = async (req, res) => {
  try {
    const { title, description, content } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ 
        message: 'Please provide title and description' 
      });
    }

    // Create course
    const course = await Course.create({
      title,
      description,
      instructor: req.user.id,
      content: content || [],
    });

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all courses with search query support
exports.getCourses = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};

    // Simple search query
    if (q) {
      query = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ],
      };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .populate('students.user', 'name email');

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('students.user', 'name email');

    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update course this is for instructor only, and also only for the each instrctor's own course
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    // Check if user is the course instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only update your own courses' 
      });
    }

    const { title, description, content } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { title, description, content },
      { new: true, runValidators: true }
    ).populate('instructor', 'name email');

    res.status(200).json({
      success: true,
      course: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete course this is for instructor only, and also only for the each instrctor's own course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    // Check if user is the course instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only delete your own courses' 
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Enroll in course - student only can enroll
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = course.students.some(
      (student) => student.user.toString() === req.user.id
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ 
        message: 'You are already enrolled in this course' 
      });
    }

    // Add student to course
    course.students.push({
      user: req.user.id,
      enrolledAt: Date.now(),
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course',
      course,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get enrolled students for a course (instructor only & own course)
exports.getEnrolledStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('students.user', 'name email');  // include student details for table

    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    // Check if user is the course instructor
    if (course.instructor._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only view students for your own courses' 
      });
    }

    // Extract students for simple table response
    const studentsList = course.students.map(student => ({
      id: student.user._id,
      name: student.user.name,
      email: student.user.email,
      enrolledAt: student.enrolledAt,
    }));

    res.status(200).json({
      success: true,
      courseTitle: course.title,
      totalEnrolled: studentsList.length,
      students: studentsList,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};