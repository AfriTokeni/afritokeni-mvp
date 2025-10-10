import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const WhitepaperPage = () => {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/docs/WHITEPAPER.md')
      .then((res) => res.text())
      .then((text) => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading whitepaper:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <article className="prose prose-lg prose-neutral max-w-none
              prose-headings:font-bold
              prose-h1:text-4xl prose-h1:mb-4 prose-h1:mt-8
              prose-h2:text-3xl prose-h2:mb-3 prose-h2:mt-8 prose-h2:border-b prose-h2:border-neutral-200 prose-h2:pb-2
              prose-h3:text-2xl prose-h3:mb-2 prose-h3:mt-6
              prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4
              prose-p:text-neutral-700 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-neutral-900 prose-strong:font-semibold
              prose-code:text-sm prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-neutral-900 prose-pre:text-neutral-100
              prose-blockquote:border-l-4 prose-blockquote:border-neutral-300 prose-blockquote:italic
              prose-ul:list-disc prose-ul:pl-6
              prose-ol:list-decimal prose-ol:pl-6
              prose-li:text-neutral-700
              prose-table:border-collapse prose-table:w-full
              prose-th:bg-neutral-100 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-neutral-300
              prose-td:p-3 prose-td:border prose-td:border-neutral-300
              prose-img:rounded-lg prose-img:shadow-md
              prose-hr:border-neutral-200 prose-hr:my-8
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {markdown}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default WhitepaperPage;
