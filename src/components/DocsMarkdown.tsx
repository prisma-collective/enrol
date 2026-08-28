import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocsMarkdownProps {
  content: string;
}

export default function DocsMarkdown({ content }: DocsMarkdownProps) {
  return (
    <div className="overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-3xl text-white mb-6 text-left" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-2xl text-white mb-4 mt-10 text-left" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-xl text-white mb-3 mt-8" {...props} />
          ),
          p: ({ ...props }) => (
            <p className="text-gray-200 mb-4 text-left" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside mb-4 text-gray-200" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside mb-4 text-gray-200" {...props} />
          ),
          li: ({ ...props }) => <li className="mb-1" {...props} />,
          em: ({ ...props }) => <em className="italic text-gray-300" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-white" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 mb-4" {...props} />
          ),
          code: ({ ...props }) => (
            <code className="bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm" {...props} />
          ),
          pre: ({ ...props }) => (
            <pre className="bg-gray-900 text-gray-200 p-4 rounded-lg overflow-x-auto mb-4" {...props} />
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300 transition-colors"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
