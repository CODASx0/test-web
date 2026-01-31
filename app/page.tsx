import Link from "next/link";

export default function HomePage() {
  const projects = [
    {
      id: "onboarding",
      title: "Onboarding Flow",
      description: "Interactive onboarding experience with step-by-step guidance.",
      slug: "onboarding",
    },
    {
      id: "chatpanel",
      title: "ChatPanel Demo",
      description: "AI conversation panel with streaming messages and tool calls.",
      slug: "chatpanel",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-[#f4f4f5]">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-12">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-nohemi)' }}>
          Projects
        </h1>
      </div>

      <div className="grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/${project.slug}`}
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 bg-white shadow-sm"
          >
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {project.title}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50 text-gray-600">
              {project.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
