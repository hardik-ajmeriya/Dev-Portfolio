// This file contains the backend API structure that can be implemented with Express + MongoDB

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  techStack: string[];
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  createdAt: Date;
}

// Mock API functions that would connect to your Express backend
export const api = {
  // Contact form submission
  submitContact: async (data: Omit<ContactFormData, 'createdAt'>) => {
    // In production, this would POST to your Express server
    // Example: await fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })
    console.log('Submitting contact form:', data);
    return { success: true, message: 'Message sent successfully' };
  },

  // Fetch projects
  getProjects: async (): Promise<Project[]> => {
    // In production, this would GET from your Express server
    // Example: const response = await fetch('/api/projects'); return response.json();
    return [
      {
        id: '1',
        title: 'E-Commerce Platform',
        description: 'Full-stack e-commerce solution with React, Node.js, and MongoDB',
        image: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=600',
        techStack: ['React', 'Node.js', 'MongoDB', 'Express', 'Tailwind CSS'],
        githubUrl: 'https://github.com/yourusername/ecommerce-platform',
        liveUrl: 'https://ecommerce-demo.vercel.app',
        featured: true,
        createdAt: new Date(),
      },
      // Add more projects...
    ];
  },
};