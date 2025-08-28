'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  altSpellings: string[];
  products: string[];
  competitors: string[];
  createdAt: string;
  lastScanned?: string;
  verified?: boolean;
  brand?: {
    website?: string;
    industry?: string;
    description?: string;
  };
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Load projects from localStorage
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    }
  }, []);

  const handleNewProject = () => {
    // Navigate to new setup page with brand verification
    router.push('/setup-v2');
  };

  const handleSelectProject = (projectId: string) => {
    // Store selected project and navigate to dashboard
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      localStorage.setItem('currentProject', JSON.stringify(project));
      localStorage.setItem(
        'brandConfig',
        JSON.stringify({
          name: project.name,
          altSpellings: project.altSpellings,
          products: project.products,
          competitors: project.competitors,
        })
      );
      router.push('/dashboard');
    }
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">VibeRank</h1>
          <p className="text-slate-400 text-lg">AI Search Engine Brand Monitoring</p>
        </div>

        {/* Projects Section */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Your Projects</h2>
          <button
            onClick={handleNewProject}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-medium mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">
              Create your first project to start monitoring your brand across AI search engines
            </p>
            <button
              onClick={handleNewProject}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className="bg-slate-900 rounded-lg border border-slate-800 p-6 hover:border-blue-600 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-900/20 relative group"
              >
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete project"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  {project.verified && (
                    <span className="px-2 py-1 bg-green-900/30 border border-green-700 rounded text-xs text-green-400">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {project.brand?.website && (
                  <div className="text-sm text-blue-400 mb-2">
                    {project.brand.website}
                  </div>
                )}

                {project.brand?.industry && (
                  <div className="text-xs text-slate-500 mb-2">
                    {project.brand.industry}
                  </div>
                )}

                <div className="space-y-2 text-sm text-slate-400">
                  {project.products.length > 0 && (
                    <div>
                      <span className="text-slate-500">Products:</span>{' '}
                      {project.products.slice(0, 2).join(', ')}
                      {project.products.length > 2 && (
                        <span> +{project.products.length - 2} more</span>
                      )}
                    </div>
                  )}
                  {project.competitors.length > 0 && (
                    <div>
                      <span className="text-slate-500">Tracking:</span> {project.competitors.length}{' '}
                      competitor{project.competitors.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
                  <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
                  {project.lastScanned && (
                    <div>Last scan: {new Date(project.lastScanned).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
