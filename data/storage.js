import prisma from '../lib/prisma.js';

// Students
export const getStudents = async () => {
  return await prisma.student.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const getStudentById = async (id) => {
  return await prisma.student.findUnique({
    where: { id: parseInt(id) }
  });
};

export const addStudent = async (studentData) => {
  try {
    // Ensure only valid fields are passed
    const data = {
      name: String(studentData.name || '').trim(),
      email: String(studentData.email || '').trim(),
    };
    
    // Validate required fields
    if (!data.name || !data.email) {
      throw new Error('Name and email are required');
    }
    
    // Only add optional fields if they exist and are valid
    if (studentData.age !== undefined && studentData.age !== null && studentData.age !== '') {
      const ageNum = parseInt(studentData.age);
      if (!isNaN(ageNum) && ageNum > 0) {
        data.age = ageNum;
      }
    }
    
    if (studentData.grade !== undefined && studentData.grade !== null && String(studentData.grade).trim() !== '') {
      data.grade = String(studentData.grade).trim();
    }
    
    console.log('Creating student with data:', JSON.stringify(data, null, 2));
    
    // Create the student
    const result = await prisma.student.create({
      data: data
    });
    
    console.log('Student created successfully:', result.id);
    return result;
  } catch (error) {
    console.error('Error in addStudent:');
    console.error('  Error name:', error.name);
    console.error('  Error message:', error.message);
    console.error('  Error code:', error.code);
    console.error('  Stack:', error.stack);
    
    // Re-throw with more context
    throw new Error(`Failed to create student: ${error.message}`);
  }
};

export const updateStudent = async (id, studentData) => {
  return await prisma.student.update({
    where: { id: parseInt(id) },
    data: studentData
  });
};

export const deleteStudent = async (id) => {
  // Prisma will automatically delete related enrollments due to onDelete: Cascade
  return await prisma.student.delete({
    where: { id: parseInt(id) }
  });
};

// Classes
export const getClasses = async () => {
  return await prisma.class.findMany({
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getClassById = async (id) => {
  return await prisma.class.findUnique({
    where: { id: parseInt(id) },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

export const addClass = async (classData) => {
  return await prisma.class.create({
    data: classData,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

export const updateClass = async (id, classData) => {
  return await prisma.class.update({
    where: { id: parseInt(id) },
    data: classData,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

export const deleteClass = async (id) => {
  // Prisma will automatically delete related enrollments due to onDelete: Cascade
  return await prisma.class.delete({
    where: { id: parseInt(id) }
  });
};

// Teachers
export const getTeachers = async () => {
  return await prisma.teacher.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const getTeacherById = async (id) => {
  return await prisma.teacher.findUnique({
    where: { id: parseInt(id) }
  });
};

export const addTeacher = async (teacherData) => {
  return await prisma.teacher.create({
    data: teacherData
  });
};

export const updateTeacher = async (id, teacherData) => {
  return await prisma.teacher.update({
    where: { id: parseInt(id) },
    data: teacherData
  });
};

export const deleteTeacher = async (id) => {
  return await prisma.teacher.delete({
    where: { id: parseInt(id) }
  });
};

// Enrollments
export const getEnrollments = async () => {
  return await prisma.enrollment.findMany({
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  });
};

export const getEnrollmentById = async (id) => {
  return await prisma.enrollment.findUnique({
    where: { id: parseInt(id) },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
};

export const getEnrollmentsByStudent = async (studentId) => {
  return await prisma.enrollment.findMany({
    where: { studentId: parseInt(studentId) },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  });
};

export const getEnrollmentsByClass = async (classId) => {
  return await prisma.enrollment.findMany({
    where: { classId: parseInt(classId) },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  });
};

export const addEnrollment = async (enrollmentData) => {
  // Check if student exists
  const student = await getStudentById(enrollmentData.studentId);
  if (!student) {
    throw new Error('Student not found');
  }
  
  // Check if class exists
  const classItem = await getClassById(enrollmentData.classId);
  if (!classItem) {
    throw new Error('Class not found');
  }
  
  // Prisma unique constraint will handle duplicate enrollments
  try {
    return await prisma.enrollment.create({
      data: {
        studentId: parseInt(enrollmentData.studentId),
        classId: parseInt(enrollmentData.classId)
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new Error('Student is already enrolled in this class');
    }
    throw error;
  }
};

export const deleteEnrollment = async (id) => {
  return await prisma.enrollment.delete({
    where: { id: parseInt(id) }
  });
};

export const deleteEnrollmentByStudentAndClass = async (studentId, classId) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: parseInt(studentId),
      classId: parseInt(classId)
    }
  });
  
  if (!enrollment) {
    return null;
  }
  
  return await prisma.enrollment.delete({
    where: { id: enrollment.id }
  });
};

// Schools
export const getSchools = async () => {
  return await prisma.school.findMany({
    include: {
      branches: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getSchoolById = async (id) => {
  return await prisma.school.findUnique({
    where: { id: parseInt(id) },
    include: {
      branches: true
    }
  });
};

export const addSchool = async (schoolData) => {
  const data = {
    name: String(schoolData.name || '').trim(),
    code: String(schoolData.code || '').trim(),
  };

  if (!data.name || !data.code) {
    throw new Error('Name and code are required');
  }

  // Add optional fields
  if (schoolData.address) data.address = String(schoolData.address).trim();
  if (schoolData.phone) data.phone = String(schoolData.phone).trim();
  if (schoolData.email) data.email = String(schoolData.email).trim();
  if (schoolData.principal) data.principal = String(schoolData.principal).trim();
  if (schoolData.description) data.description = String(schoolData.description).trim();

  return await prisma.school.create({
    data: data,
    include: {
      branches: true
    }
  });
};

export const updateSchool = async (id, schoolData) => {
  const data = {};
  
  if (schoolData.name) data.name = String(schoolData.name).trim();
  if (schoolData.code) data.code = String(schoolData.code).trim();
  if (schoolData.address !== undefined) data.address = schoolData.address ? String(schoolData.address).trim() : null;
  if (schoolData.phone !== undefined) data.phone = schoolData.phone ? String(schoolData.phone).trim() : null;
  if (schoolData.email !== undefined) data.email = schoolData.email ? String(schoolData.email).trim() : null;
  if (schoolData.principal !== undefined) data.principal = schoolData.principal ? String(schoolData.principal).trim() : null;
  if (schoolData.description !== undefined) data.description = schoolData.description ? String(schoolData.description).trim() : null;

  return await prisma.school.update({
    where: { id: parseInt(id) },
    data: data,
    include: {
      branches: true
    }
  });
};

export const deleteSchool = async (id) => {
  // Prisma will automatically delete related branches due to onDelete: Cascade
  return await prisma.school.delete({
    where: { id: parseInt(id) }
  });
};

// Branches
export const getBranches = async () => {
  return await prisma.branch.findMany({
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getBranchById = async (id) => {
  return await prisma.branch.findUnique({
    where: { id: parseInt(id) },
    include: {
      school: true
    }
  });
};

export const getBranchesBySchool = async (schoolId) => {
  return await prisma.branch.findMany({
    where: { schoolId: parseInt(schoolId) },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const addBranch = async (branchData) => {
  const data = {
    name: String(branchData.name || '').trim(),
    code: String(branchData.code || '').trim(),
    schoolId: parseInt(branchData.schoolId),
  };

  if (!data.name || !data.code || !data.schoolId) {
    throw new Error('Name, code, and school are required');
  }

  // Verify school exists
  const school = await getSchoolById(data.schoolId);
  if (!school) {
    throw new Error('School not found');
  }

  // Add optional fields
  if (branchData.address) data.address = String(branchData.address).trim();
  if (branchData.phone) data.phone = String(branchData.phone).trim();
  if (branchData.email) data.email = String(branchData.email).trim();
  if (branchData.manager) data.manager = String(branchData.manager).trim();
  if (branchData.description) data.description = String(branchData.description).trim();

  return await prisma.branch.create({
    data: data,
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
};

export const updateBranch = async (id, branchData) => {
  const data = {};
  
  if (branchData.name) data.name = String(branchData.name).trim();
  if (branchData.code) data.code = String(branchData.code).trim();
  if (branchData.schoolId) data.schoolId = parseInt(branchData.schoolId);
  if (branchData.address !== undefined) data.address = branchData.address ? String(branchData.address).trim() : null;
  if (branchData.phone !== undefined) data.phone = branchData.phone ? String(branchData.phone).trim() : null;
  if (branchData.email !== undefined) data.email = branchData.email ? String(branchData.email).trim() : null;
  if (branchData.manager !== undefined) data.manager = branchData.manager ? String(branchData.manager).trim() : null;
  if (branchData.description !== undefined) data.description = branchData.description ? String(branchData.description).trim() : null;

  // If schoolId is being updated, verify school exists
  if (branchData.schoolId) {
    const school = await getSchoolById(branchData.schoolId);
    if (!school) {
      throw new Error('School not found');
    }
  }

  return await prisma.branch.update({
    where: { id: parseInt(id) },
    data: data,
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
};

export const deleteBranch = async (id) => {
  return await prisma.branch.delete({
    where: { id: parseInt(id) }
  });
};

// Lesson Plans
export const getLessonPlans = async (filters = {}) => {
  const where = {};
  
  if (filters.teacherId) {
    where.teacherId = parseInt(filters.teacherId);
  }
  
  if (filters.classId) {
    where.classId = parseInt(filters.classId);
  }
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  return await prisma.lessonPlan.findMany({
    where,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: { date: 'desc' }
  });
};

export const getLessonPlanById = async (id) => {
  return await prisma.lessonPlan.findUnique({
    where: { id: parseInt(id) },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
};

export const addLessonPlan = async (lessonPlanData) => {
  const data = {
    title: String(lessonPlanData.title || '').trim(),
    teacherId: parseInt(lessonPlanData.teacherId),
    date: new Date(lessonPlanData.date),
    status: lessonPlanData.status || 'draft',
  };
  
  if (!data.title || !data.teacherId) {
    throw new Error('Title and teacher ID are required');
  }
  
  // Optional fields
  if (lessonPlanData.description) {
    data.description = String(lessonPlanData.description).trim();
  }
  
  if (lessonPlanData.subject) {
    data.subject = String(lessonPlanData.subject).trim();
  }
  
  if (lessonPlanData.classId) {
    data.classId = parseInt(lessonPlanData.classId);
  }
  
  if (lessonPlanData.objectives) {
    data.objectives = String(lessonPlanData.objectives).trim();
  }
  
  if (lessonPlanData.materials) {
    data.materials = String(lessonPlanData.materials).trim();
  }
  
  if (lessonPlanData.activities) {
    data.activities = String(lessonPlanData.activities).trim();
  }
  
  if (lessonPlanData.homework) {
    data.homework = String(lessonPlanData.homework).trim();
  }
  
  if (lessonPlanData.notes) {
    data.notes = String(lessonPlanData.notes).trim();
  }
  
  return await prisma.lessonPlan.create({
    data,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
};

export const updateLessonPlan = async (id, lessonPlanData) => {
  const existing = await getLessonPlanById(id);
  if (!existing) {
    throw new Error('Lesson plan not found');
  }
  
  const data = {};
  
  if (lessonPlanData.title !== undefined) {
    data.title = String(lessonPlanData.title).trim();
  }
  
  if (lessonPlanData.date !== undefined) {
    data.date = new Date(lessonPlanData.date);
  }
  
  if (lessonPlanData.status !== undefined) {
    data.status = String(lessonPlanData.status).trim();
  }
  
  if (lessonPlanData.description !== undefined) {
    data.description = lessonPlanData.description ? String(lessonPlanData.description).trim() : null;
  }
  
  if (lessonPlanData.subject !== undefined) {
    data.subject = lessonPlanData.subject ? String(lessonPlanData.subject).trim() : null;
  }
  
  if (lessonPlanData.classId !== undefined) {
    data.classId = lessonPlanData.classId ? parseInt(lessonPlanData.classId) : null;
  }
  
  if (lessonPlanData.objectives !== undefined) {
    data.objectives = lessonPlanData.objectives ? String(lessonPlanData.objectives).trim() : null;
  }
  
  if (lessonPlanData.materials !== undefined) {
    data.materials = lessonPlanData.materials ? String(lessonPlanData.materials).trim() : null;
  }
  
  if (lessonPlanData.activities !== undefined) {
    data.activities = lessonPlanData.activities ? String(lessonPlanData.activities).trim() : null;
  }
  
  if (lessonPlanData.homework !== undefined) {
    data.homework = lessonPlanData.homework ? String(lessonPlanData.homework).trim() : null;
  }
  
  if (lessonPlanData.notes !== undefined) {
    data.notes = lessonPlanData.notes ? String(lessonPlanData.notes).trim() : null;
  }
  
  return await prisma.lessonPlan.update({
    where: { id: parseInt(id) },
    data,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
};

export const deleteLessonPlan = async (id) => {
  return await prisma.lessonPlan.delete({
    where: { id: parseInt(id) }
  });
};

