import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description?: string;
  noIndex?: boolean;
}

/**
 * Hook to manage page titles, meta descriptions, and search engine indexing (B14).
 * Ensures authenticated and private portal views receive "noindex, nofollow" tags,
 * while public pages display optimized metadata and open graph titles.
 */
export function usePageMeta({ title, description, noIndex = false }: PageMetaOptions) {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title.includes('NexaLink') ? title : `${title} · NexaLink | VIT Mumbai`;
    document.title = formattedTitle;

    // 2. Update Meta Description
    if (description) {
      let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!descTag) {
        descTag = document.createElement('meta');
        descTag.name = 'description';
        document.head.appendChild(descTag);
      }
      descTag.content = description;
    }

    // 3. Update Robots Tag
    let robotsTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noIndex) {
      if (!robotsTag) {
        robotsTag = document.createElement('meta');
        robotsTag.name = 'robots';
        document.head.appendChild(robotsTag);
      }
      robotsTag.content = 'noindex, nofollow';
    } else if (robotsTag) {
      robotsTag.content = 'index, follow';
    }
  }, [title, description, noIndex]);
}
