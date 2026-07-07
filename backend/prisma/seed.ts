import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const connectionString = process.env.DATABASE_URL as string;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.lessonProgress.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseReview.deleteMany();
  await prisma.courseWishlist.deleteMany();
  await prisma.coursePurchase.deleteMany();
  await prisma.courseAnalytics.deleteMany();
  await prisma.courseTagRelation.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseSection.deleteMany();
  await prisma.course.deleteMany();
  await prisma.courseTag.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create Users (5 Creators + 5 Students)
  const creators = [];
  const students = [];

  for (let i = 1; i <= 5; i++) {
    const creator = await prisma.user.create({
      data: {
        email: `creator${i}@talentnest.com`,
        password: await bcrypt.hash('password123', 10),
        name: `Creator ${i}`,
        avatar: `https://ui-avatars.com/api/?name=Creator+${i}&background=0B1F3A&color=fff`,
        role: 'FREELANCER',
        onboardingCompleted: true,
      },
    });
    creators.push(creator);
  }

  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@talentnest.com`,
        password: await bcrypt.hash('password123', 10),
        name: `Student ${i}`,
        avatar: `https://ui-avatars.com/api/?name=Student+${i}&background=F26A21&color=fff`,
        role: 'FREELANCER',
        onboardingCompleted: true,
      },
    });
    students.push(student);
  }

  console.log('✅ Created 10 users (5 creators, 5 students)');

  // Create Creator Profiles
  for (const creator of creators) {
    await prisma.creatorProfile.create({
      data: {
        userId: creator.id,
        bio: `Expert instructor with 10+ years of experience in teaching and industry practice. Passionate about sharing knowledge and helping students achieve their goals.`,
        website: `https://creator${creators.indexOf(creator) + 1}.com`,
        socialLinks: {
          linkedin: `https://linkedin.com/in/creator${creators.indexOf(creator) + 1}`,
          twitter: `https://twitter.com/creator${creators.indexOf(creator) + 1}`,
          github: `https://github.com/creator${creators.indexOf(creator) + 1}`,
        },
        followersCount: Math.floor(Math.random() * 5000) + 1000,
        studentsCount: 0,
        totalRevenue: 0,
        averageRating: 4.5 + Math.random() * 0.5,
      },
    });
  }

  console.log('✅ Created 5 creator profiles');

  // Create Course Categories using upsert to avoid duplicates
  const categoryData = [
    { name: 'Web Development', slug: 'web-development', description: 'Learn to build modern web applications with the latest technologies', icon: '💻', order: 1 },
    { name: 'Mobile Development', slug: 'mobile-development', description: 'Create native and cross-platform mobile applications', icon: '📱', order: 2 },
    { name: 'UI/UX Design', slug: 'ui-ux-design', description: 'Design beautiful and functional user interfaces and experiences', icon: '🎨', order: 3 },
    { name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'Master AI concepts, machine learning, and neural networks', icon: '🤖', order: 4 },
    { name: 'Machine Learning', slug: 'machine-learning', description: 'Build intelligent systems with ML algorithms and data science', icon: '🧠', order: 5 },
    { name: 'Data Science', slug: 'data-science', description: 'Analyze data, build models, and derive insights from information', icon: '📊', order: 6 },
    { name: 'Cyber Security', slug: 'cyber-security', description: 'Protect systems, networks, and data from cyber threats', icon: '🔒', order: 7 },
    { name: 'Cloud Computing', slug: 'cloud-computing', description: 'Deploy and manage applications on cloud platforms like AWS, Azure', icon: '☁️', order: 8 },
    { name: 'DevOps', slug: 'devops', description: 'Streamline development and operations with CI/CD and automation', icon: '⚙️', order: 9 },
    { name: 'Programming Languages', slug: 'programming-languages', description: 'Master various programming languages and paradigms', icon: '💻', order: 10 },
    { name: 'Database', slug: 'database', description: 'Learn database design, SQL, NoSQL, and data management', icon: '🗄️', order: 11 },
    { name: 'Software Testing', slug: 'software-testing', description: 'Ensure software quality through testing methodologies', icon: '✅', order: 12 },
    { name: 'Game Development', slug: 'game-development', description: 'Create interactive games using game engines and programming', icon: '🎮', order: 13 },
    { name: 'Digital Marketing', slug: 'digital-marketing', description: 'Grow businesses through online marketing strategies', icon: '📈', order: 14 },
    { name: 'Business', slug: 'business', description: 'Develop business skills, entrepreneurship, and management', icon: '💼', order: 15 },
    { name: 'Finance', slug: 'finance', description: 'Understand financial concepts, investing, and money management', icon: '💰', order: 16 },
    { name: 'Graphic Design', slug: 'graphic-design', description: 'Create visual content for print and digital media', icon: '🖌️', order: 17 },
    { name: 'Video Editing', slug: 'video-editing', description: 'Edit and produce professional video content', icon: '🎬', order: 18 },
    { name: 'Photography', slug: 'photography', description: 'Capture and edit stunning photographs', icon: '📷', order: 19 },
    { name: 'Career Development', slug: 'career-development', description: 'Advance your career with professional skills and strategies', icon: '🚀', order: 20 },
  ];

  const categories = await Promise.all(
    categoryData.map((cat) =>
      prisma.courseCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );

  console.log(`✅ Upserted ${categories.length} course categories`);

  // Create Course Tags using upsert to avoid duplicates
  const tagData = [
    { name: 'React', slug: 'react' },
    { name: 'Next.js', slug: 'nextjs' },
    { name: 'Angular', slug: 'angular' },
    { name: 'Vue.js', slug: 'vuejs' },
    { name: 'HTML', slug: 'html' },
    { name: 'CSS', slug: 'css' },
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Tailwind CSS', slug: 'tailwindcss' },
    { name: 'Bootstrap', slug: 'bootstrap' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: 'Express.js', slug: 'expressjs' },
    { name: 'Fastify', slug: 'fastify' },
    { name: 'Prisma', slug: 'prisma' },
    { name: 'PostgreSQL', slug: 'postgresql' },
    { name: 'MySQL', slug: 'mysql' },
    { name: 'MongoDB', slug: 'mongodb' },
    { name: 'Redis', slug: 'redis' },
    { name: 'Docker', slug: 'docker' },
    { name: 'Kubernetes', slug: 'kubernetes' },
    { name: 'AWS', slug: 'aws' },
    { name: 'Azure', slug: 'azure' },
    { name: 'Git', slug: 'git' },
    { name: 'GitHub', slug: 'github' },
    { name: 'Python', slug: 'python' },
    { name: 'Java', slug: 'java' },
    { name: 'Spring Boot', slug: 'springboot' },
    { name: 'C#', slug: 'csharp' },
    { name: 'Flutter', slug: 'flutter' },
    { name: 'React Native', slug: 'reactnative' },
    { name: 'Machine Learning', slug: 'machine-learning' },
    { name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
    { name: 'Data Science', slug: 'data-science' },
    { name: 'Cyber Security', slug: 'cyber-security' },
    { name: 'DevOps', slug: 'devops' },
    { name: 'REST API', slug: 'restapi' },
    { name: 'GraphQL', slug: 'graphql' },
    { name: 'System Design', slug: 'system-design' },
    { name: 'Figma', slug: 'figma' },
    { name: 'UI Design', slug: 'ui-design' },
    { name: 'UX Design', slug: 'ux-design' },
  ];

  const tags = await Promise.all(
    tagData.map((tag) =>
      prisma.courseTag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag,
      })
    )
  );

  console.log(`✅ Upserted ${tags.length} course tags`);

  // Create Courses (15 courses across creators)
  const courses = [];
  const courseData = [
    {
      title: 'Complete React Developer Course',
      subtitle: 'Build modern web applications with React 18',
      description: 'Master React from scratch. Learn hooks, context, Redux, and build production-ready applications. This comprehensive course covers everything you need to become a professional React developer.',
      level: 'BEGINNER' as const,
      language: 'English',
      price: 49.99,
      discountPrice: 29.99,
      duration: 1200,
      requirements: ['Basic JavaScript knowledge', 'Understanding of HTML/CSS', 'Code editor installed'],
      whatYouWillLearn: ['React fundamentals', 'Hooks and state management', 'Redux Toolkit', 'Testing with Jest', 'Deployment strategies'],
      targetAudience: ['Beginner developers', 'Frontend developers', 'JavaScript developers'],
    },
    {
      title: 'Advanced JavaScript Patterns',
      subtitle: 'Master advanced JavaScript concepts and patterns',
      description: 'Take your JavaScript skills to the next level. Learn closures, prototypes, async programming, and design patterns used by senior developers.',
      level: 'ADVANCED' as const,
      language: 'English',
      price: 79.99,
      discountPrice: 59.99,
      duration: 900,
      requirements: ['Strong JavaScript fundamentals', 'ES6+ knowledge', 'Experience with web development'],
      whatYouWillLearn: ['Closures and scopes', 'Prototype chain', 'Async/await patterns', 'Design patterns', 'Performance optimization'],
      targetAudience: ['Intermediate developers', 'Senior developers', 'JavaScript enthusiasts'],
    },
    {
      title: 'Node.js Backend Development',
      subtitle: 'Build scalable backend APIs with Node.js',
      description: 'Learn to build robust backend services with Node.js, Express, MongoDB, and PostgreSQL. From REST APIs to real-time applications.',
      level: 'INTERMEDIATE' as const,
      language: 'English',
      price: 69.99,
      discountPrice: 49.99,
      duration: 1500,
      requirements: ['JavaScript basics', 'Understanding of HTTP', 'Database fundamentals'],
      whatYouWillLearn: ['Express.js framework', 'REST API design', 'Database integration', 'Authentication', 'Real-time with Socket.io'],
      targetAudience: ['Backend developers', 'Full-stack developers', 'JavaScript developers'],
    },
    {
      title: 'Python for Data Science',
      subtitle: 'Complete data science bootcamp with Python',
      description: 'Master data science with Python. Learn pandas, numpy, matplotlib, scikit-learn, and build real-world machine learning projects.',
      level: 'BEGINNER' as const,
      language: 'English',
      price: 89.99,
      discountPrice: 69.99,
      duration: 1800,
      requirements: ['Basic programming knowledge', 'Math fundamentals', 'Computer with Python installed'],
      whatYouWillLearn: ['Python fundamentals', 'Data manipulation with pandas', 'Data visualization', 'Machine learning basics', 'Project deployment'],
      targetAudience: ['Data science beginners', 'Analysts', 'Researchers'],
    },
    {
      title: 'UI/UX Design Masterclass',
      subtitle: 'Design beautiful and functional user interfaces',
      description: 'Learn UI/UX design from scratch. Master Figma, design principles, user research, and create stunning interfaces that users love.',
      level: 'BEGINNER' as const,
      language: 'English',
      price: 59.99,
      discountPrice: 39.99,
      duration: 1000,
      requirements: ['No prior design experience needed', 'Computer with internet', 'Figma account (free)'],
      whatYouWillLearn: ['Design principles', 'Figma mastery', 'User research', 'Prototyping', 'Design systems'],
      targetAudience: ['Design beginners', 'Developers wanting design skills', 'Product managers'],
    },
    {
      title: 'TypeScript Fundamentals',
      subtitle: 'Add type safety to your JavaScript projects',
      description: 'Master TypeScript and write safer, more maintainable code. Learn types, interfaces, generics, and integrate TypeScript into React projects.',
      level: 'INTERMEDIATE' as const,
      language: 'English',
      price: 44.99,
      discountPrice: 34.99,
      duration: 800,
      requirements: ['Strong JavaScript knowledge', 'Experience with React', 'Understanding of OOP'],
      whatYouWillLearn: ['Type system basics', 'Interfaces and types', 'Generics', 'React with TypeScript', 'Advanced patterns'],
      targetAudience: ['JavaScript developers', 'React developers', 'Frontend engineers'],
    },
    {
      title: 'Mobile App Development with React Native',
      subtitle: 'Build cross-platform mobile applications',
      description: 'Create iOS and Android apps with React Native. Learn navigation, state management, native modules, and publish to app stores.',
      level: 'INTERMEDIATE' as const,
      language: 'English',
      price: 79.99,
      discountPrice: 59.99,
      duration: 1400,
      requirements: ['React knowledge', 'JavaScript fundamentals', 'Mobile development interest'],
      whatYouWillLearn: ['React Native basics', 'Navigation', 'State management', 'Native APIs', 'App deployment'],
      targetAudience: ['React developers', 'Web developers', 'Mobile enthusiasts'],
    },
    {
      title: 'Machine Learning with Python',
      subtitle: 'Build intelligent systems with ML algorithms',
      description: 'Deep dive into machine learning. Learn supervised and unsupervised learning, neural networks, and build production ML systems.',
      level: 'ADVANCED' as const,
      language: 'English',
      price: 99.99,
      discountPrice: 79.99,
      duration: 2000,
      requirements: ['Python proficiency', 'Math basics', 'Statistics fundamentals'],
      whatYouWillLearn: ['ML algorithms', 'Neural networks', 'Model evaluation', 'Feature engineering', 'ML deployment'],
      targetAudience: ['Data scientists', 'Python developers', 'ML engineers'],
    },
    {
      title: 'Digital Marketing Strategy',
      subtitle: 'Grow your business with effective marketing',
      description: 'Learn comprehensive digital marketing strategies. Master SEO, social media marketing, content marketing, and analytics.',
      level: 'BEGINNER' as const,
      language: 'English',
      price: 54.99,
      discountPrice: 39.99,
      duration: 1100,
      requirements: ['Basic business understanding', 'Marketing interest', 'Computer with internet'],
      whatYouWillLearn: ['SEO fundamentals', 'Social media strategy', 'Content marketing', 'Email marketing', 'Analytics'],
      targetAudience: ['Business owners', 'Marketers', 'Entrepreneurs'],
    },
    {
      title: 'Vue.js 3 Complete Guide',
      subtitle: 'Build modern apps with Vue.js 3 and Composition API',
      description: 'Master Vue.js 3 with the Composition API. Learn state management, routing, testing, and build scalable Vue applications.',
      level: 'INTERMEDIATE' as const,
      language: 'English',
      price: 49.99,
      discountPrice: 34.99,
      duration: 1100,
      requirements: ['JavaScript basics', 'Understanding of frameworks', 'Web development fundamentals'],
      whatYouWillLearn: ['Vue.js fundamentals', 'Composition API', 'Pinia state management', 'Vue Router', 'Testing'],
      targetAudience: ['JavaScript developers', 'Frontend developers', 'Vue enthusiasts'],
    },
    {
      title: 'GraphQL with Node.js',
      subtitle: 'Build efficient APIs with GraphQL',
      description: 'Learn GraphQL from scratch. Build schemas, resolvers, and integrate with Node.js, databases, and frontend frameworks.',
      level: 'ADVANCED' as const,
      language: 'English',
      price: 69.99,
      discountPrice: 49.99,
      duration: 900,
      requirements: ['Node.js knowledge', 'REST API experience', 'JavaScript proficiency'],
      whatYouWillLearn: ['GraphQL fundamentals', 'Schema design', 'Resolvers', 'Apollo Server', 'Frontend integration'],
      targetAudience: ['Backend developers', 'Full-stack developers', 'API developers'],
    },
    {
      title: 'Figma for Developers',
      subtitle: 'Collaborate effectively with designers using Figma',
      description: 'Learn Figma from a developer perspective. Understand design files, extract assets, and collaborate seamlessly with design teams.',
      level: 'BEGINNER' as const,
      language: 'English',
      price: 39.99,
      discountPrice: 29.99,
      duration: 600,
      requirements: ['No design experience needed', 'Developer background', 'Figma account (free)'],
      whatYouWillLearn: ['Figma interface', 'Design inspection', 'Asset extraction', 'Developer handoff', 'Design systems'],
      targetAudience: ['Developers', 'Frontend engineers', 'Full-stack developers'],
    },
    {
      title: 'AWS Cloud Practitioner',
      subtitle: 'Get started with cloud computing on AWS',
      description: 'Learn AWS fundamentals and prepare for the Cloud Practitioner certification. Cover core services, security, and architecture.',
      level: 'BEGINNER' as const,
      language: 'English',
      price: 89.99,
      discountPrice: 69.99,
      duration: 1200,
      requirements: ['Basic IT knowledge', 'Cloud computing interest', 'AWS account (free tier)'],
      whatYouWillLearn: ['AWS core services', 'Cloud concepts', 'Security basics', 'Architecture principles', 'Cost management'],
      targetAudience: ['IT professionals', 'Developers', 'System administrators'],
    },
    {
      title: 'Docker and Kubernetes',
      subtitle: 'Containerize and orchestrate your applications',
      description: 'Master containerization with Docker and orchestration with Kubernetes. Learn to deploy, scale, and manage containerized applications.',
      level: 'ADVANCED' as const,
      language: 'English',
      price: 99.99,
      discountPrice: 79.99,
      duration: 1600,
      requirements: ['Linux basics', 'Development experience', 'Understanding of deployment'],
      whatYouWillLearn: ['Docker fundamentals', 'Container orchestration', 'Kubernetes basics', 'CI/CD integration', 'Production deployment'],
      targetAudience: ['DevOps engineers', 'Backend developers', 'System administrators'],
    },
    {
      title: 'SEO Complete Guide',
      subtitle: 'Rank higher on search engines',
      description: 'Master SEO from keyword research to technical optimization. Learn on-page, off-page, and technical SEO strategies.',
      level: 'INTERMEDIATE' as const,
      language: 'English',
      price: 59.99,
      discountPrice: 44.99,
      duration: 1000,
      requirements: ['Basic marketing knowledge', 'Website understanding', 'Analytical mindset'],
      whatYouWillLearn: ['Keyword research', 'On-page SEO', 'Technical SEO', 'Link building', 'Analytics'],
      targetAudience: ['Marketers', 'Content creators', 'Business owners'],
    },
  ];

  for (let i = 0; i < courseData.length; i++) {
    const data = courseData[i];
    const creator = creators[i % creators.length];
    const category = categories[i % categories.length];
    
    const course = await prisma.course.create({
      data: {
        creatorId: creator.id,
        categoryId: category.id,
        title: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        subtitle: data.subtitle,
        description: data.description,
        thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop`,
        price: data.price,
        discountPrice: data.discountPrice,
        level: data.level,
        language: data.language,
        duration: data.duration,
        status: 'PUBLISHED',
        visibility: true,
        requirements: data.requirements,
        whatYouWillLearn: data.whatYouWillLearn,
        targetAudience: data.targetAudience,
      },
    });
    courses.push(course);

    // Add random tags
    const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 3);
    await Promise.all(
      randomTags.map((tag) =>
        prisma.courseTagRelation.create({
          data: {
            courseId: course.id,
            tagId: tag.id,
          },
        })
      )
    );

    // Create analytics
    await prisma.courseAnalytics.create({
      data: {
        courseId: course.id,
        totalViews: Math.floor(Math.random() * 10000) + 1000,
        totalEnrollments: Math.floor(Math.random() * 500) + 50,
        totalRevenue: Math.floor(Math.random() * 50000) + 5000,
        averageRating: 4 + Math.random(),
        completionRate: 0.6 + Math.random() * 0.3,
      },
    });
  }

  console.log('✅ Created 15 courses with tags and analytics');

  // Create Course Sections and Lessons (100 lessons total)
  let lessonCount = 0;
  for (const course of courses) {
    const sectionCount = Math.floor(Math.random() * 4) + 3; // 3-6 sections per course
    const sections = [];

    for (let s = 0; s < sectionCount; s++) {
      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          title: `Section ${s + 1}: ${getSectionTitle(s)}`,
          description: `Learn the fundamentals of ${getSectionTitle(s).toLowerCase()}`,
          order: s,
        },
      });
      sections.push(section);

      const lessonCountInSection = Math.floor(Math.random() * 4) + 2; // 2-5 lessons per section
      for (let l = 0; l < lessonCountInSection; l++) {
        const lesson = await prisma.lesson.create({
          data: {
            sectionId: section.id,
            title: `Lesson ${l + 1}: ${getLessonTitle(l)}`,
            description: `In this lesson, you will learn about ${getLessonTitle(l).toLowerCase()}`,
            content: `Detailed content for ${getLessonTitle(l).toLowerCase()}. This includes examples, exercises, and practical applications.`,
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            attachments: [],
            duration: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
            type: l % 3 === 0 ? 'ARTICLE' : 'VIDEO',
            order: l,
            isPreview: l === 0,
          },
        });
        lessonCount++;
      }
    }
  }

  console.log(`✅ Created ${lessonCount} lessons across all courses`);

  // Create Enrollments and Reviews
  for (const student of students) {
    // Enroll in random courses
    const enrolledCourses = courses.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    for (const course of enrolledCourses) {
      const enrollment = await prisma.enrollment.create({
        data: {
          courseId: course.id,
          studentId: student.id,
          status: Math.random() > 0.3 ? 'ACTIVE' : 'COMPLETED',
          progress: Math.random() * 100,
          completedAt: Math.random() > 0.5 ? new Date() : null,
        },
      });

      // Create lesson progress
      const lessons = await prisma.lesson.findMany({
        where: {
          section: {
            courseId: course.id,
          },
        },
      });
      
      for (const lesson of lessons) {
        if (Math.random() > 0.3) {
          await prisma.lessonProgress.create({
            data: {
              enrollmentId: enrollment.id,
              lessonId: lesson.id,
              completed: Math.random() > 0.5,
              completedAt: Math.random() > 0.5 ? new Date() : null,
              timeSpent: Math.floor(Math.random() * 3600),
            },
          });
        }
      }

      // Create review
      if (Math.random() > 0.3) {
        await prisma.courseReview.create({
          data: {
            courseId: course.id,
            studentId: student.id,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
            review: getRandomReview(),
            reply: Math.random() > 0.5 ? 'Thank you for your feedback! We appreciate your review.' : null,
            repliedAt: Math.random() > 0.5 ? new Date() : null,
          },
        });
      }

      // Create certificate if completed
      if (enrollment.status === 'COMPLETED' && enrollment.progress >= 80) {
        await prisma.certificate.create({
          data: {
            enrollmentId: enrollment.id,
            certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            verificationCode: crypto.randomBytes(16).toString('hex'),
          },
        });
      }

      // Create purchase record
      await prisma.coursePurchase.create({
        data: {
          courseId: course.id,
          studentId: student.id,
          amount: course.discountPrice || course.price,
          currency: 'USD',
          discountAmount: course.discountPrice ? course.price - course.discountPrice : 0,
        },
      });
    }

    // Add some courses to wishlist
    const wishlistCourses = courses
      .filter((c) => !enrolledCourses.includes(c))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    for (const course of wishlistCourses) {
      await prisma.courseWishlist.create({
        data: {
          courseId: course.id,
          userId: student.id,
        },
      });
    }
  }

  console.log('✅ Created enrollments, reviews, certificates, and wishlists');

  // Update creator profiles with student counts
  for (const creator of creators) {
    const creatorCourses = await prisma.course.findMany({
      where: { creatorId: creator.id },
      include: {
        enrollments: true,
      },
    });

    const totalStudents = creatorCourses.reduce(
      (sum, course) => sum + course.enrollments.length,
      0
    );

    const totalRevenue = creatorCourses.reduce((sum, course) => {
      const courseRevenue = course.enrollments.length * (course.discountPrice || course.price);
      return sum + courseRevenue;
    }, 0);

    await prisma.creatorProfile.update({
      where: { userId: creator.id },
      data: {
        studentsCount: totalStudents,
        totalRevenue,
      },
    });
  }

  console.log('✅ Updated creator profiles with stats');

  console.log('🎉 Seed completed successfully!');
}

function getSectionTitle(index: number): string {
  const titles = [
    'Introduction',
    'Getting Started',
    'Core Concepts',
    'Advanced Topics',
    'Best Practices',
    'Real-World Projects',
  ];
  return titles[index % titles.length];
}

function getLessonTitle(index: number): string {
  const titles = [
    'Overview and Setup',
    'Basic Concepts',
    'Working with Data',
    'Building Components',
    'State Management',
    'API Integration',
    'Testing',
    'Deployment',
    'Optimization',
    'Security',
  ];
  return titles[index % titles.length];
}

function getRandomReview(): string {
  const reviews = [
    'Excellent course! The instructor explains everything clearly and the projects are very practical.',
    'Great content and well-structured. I learned a lot and can apply these skills immediately.',
    'One of the best courses I have taken. The instructor is knowledgeable and engaging.',
    'Perfect for beginners. The pace is good and the examples are easy to follow.',
    'Comprehensive coverage of the topic. I feel confident in my skills after completing this course.',
    'Highly recommended! The course material is up-to-date and relevant.',
    'Amazing instructor and great community support. Worth every penny.',
    'Clear explanations and hands-on exercises. Exactly what I was looking for.',
  ];
  return reviews[Math.floor(Math.random() * reviews.length)];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
