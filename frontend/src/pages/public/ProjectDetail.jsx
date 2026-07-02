import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import api, { resolveImageUrl } from '../../services/api';
import { PublicLayout } from '../../layouts/PublicLayout';
import { createEditorialArticleFlow, getEditableHtml, normalizeHtmlImageSources } from '../../utils/richText';

export function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await api.get(`/projects/${slug}`);
        if (res?.success && res.data) {
          setProject(res.data);
        }
      } catch (error) {
        console.error('Unable to load project', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen items-center justify-center bg-[#01030A] text-white">
          <RefreshCw className="mr-3 h-5 w-5 animate-spin text-[#2EA7FF]" />
          Loading project...
        </div>
      </PublicLayout>
    );
  }

  if (!project) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#01030A] px-6 text-center text-white">
          <h1 className="text-3xl font-semibold">Project Not Found</h1>
          <p className="mt-3 max-w-md text-[#C8D0D9]">The requested project could not be found.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-[#2EA7FF]">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const articleHtml = normalizeHtmlImageSources(
    getEditableHtml(project.rich_description || project.short_description || ''),
    resolveImageUrl
  );
  const articleFlow = createEditorialArticleFlow(
    articleHtml,
    Array.isArray(project.gallery_images) ? project.gallery_images.map((image) => resolveImageUrl(image)) : []
  );

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#01030A] text-white">
        <section className="mx-auto max-w-[1500px] px-6 py-24 sm:px-8 lg:px-12">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#2EA7FF]">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>

          {project.main_image && (
            <img
              src={resolveImageUrl(project.main_image)}
              alt={project.title}
              className="mx-auto mt-8 h-auto max-h-[760px] w-full rounded-[28px] object-contain"
            />
          )}

          <article className="mt-12">
            <h1 className="text-[40px] font-bold leading-[1.08] text-white lg:text-[48px]">{project.title}</h1>

            {articleFlow.introHtml && (
              <div
                className="project-case-study-article mt-8"
                dangerouslySetInnerHTML={{ __html: articleFlow.introHtml }}
              />
            )}

            {articleFlow.sections.map((section, index) => (
              <section key={`${section.image}-${index}`} className="project-case-study-section">
                <figure className={`project-case-study-figure project-case-study-figure--${section.align}`}>
                  <img src={section.image} alt={`${project.title} photo ${index + 1}`} />
                </figure>
                {section.html && (
                  <div
                    className="project-case-study-article"
                    dangerouslySetInnerHTML={{ __html: section.html }}
                  />
                )}
              </section>
            ))}

            {articleFlow.tailHtml && (
              <div
                className="project-case-study-article project-case-study-tail"
                dangerouslySetInnerHTML={{ __html: articleFlow.tailHtml }}
              />
            )}
          </article>
        </section>
      </main>
    </PublicLayout>
  );
}

export default ProjectDetail;
