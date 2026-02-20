import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, ArrowRightIcon, SearchIcon } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative mx-auto w-full max-w-5xl">
            {/* Top Shades */}
            <div
                aria-hidden="true"
                className="absolute inset-0 isolate hidden overflow-hidden contain-strict lg:block"
            >
                <div className="absolute inset-0 -top-14 isolate -z-10 bg-[radial-gradient(35%_80%_at_49%_0%,rgba(34,197,94,0.08),transparent)] contain-strict" />
            </div>

            {/* X Bold Faded Borders */}
            <div
                aria-hidden="true"
                className="absolute inset-0 mx-auto hidden min-h-screen w-full max-w-5xl lg:block"
            >
                <div className="absolute inset-y-0 left-0 z-10 h-full w-px bg-emerald-500/10" />
                <div className="absolute inset-y-0 right-0 z-10 h-full w-px bg-emerald-500/10" />
            </div>

            {/* main content */}
            <div className="relative flex flex-col items-center justify-center gap-6 px-4 pt-24 pb-20 sm:pt-32 sm:pb-28">
                {/* Content Faded Borders */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-1 size-full overflow-hidden"
                >
                    <div className="absolute inset-y-0 left-4 w-px bg-gradient-to-b from-transparent via-slate-800 to-slate-800 md:left-8" />
                    <div className="absolute inset-y-0 right-4 w-px bg-gradient-to-b from-transparent via-slate-800 to-slate-800 md:right-8" />
                </div>

                {/* Beta Pill */}
                <a
                    className={cn(
                        "group mx-auto flex w-fit items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 shadow-sm",
                        "animate-fade-in transition-all duration-300 ease-out"
                    )}
                    href="#"
                >
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-xs font-medium text-emerald-300">Now in public beta</span>
                    <span className="block h-4 border-l border-emerald-500/20" />
                    <ArrowRightIcon className="size-3 text-emerald-400 duration-150 ease-out group-hover:translate-x-1" />
                </a>

                {/* Title */}
                <h1
                    className={cn(
                        "animate-fade-in text-center text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl",
                        "[animation-delay:100ms]"
                    )}
                    style={{ lineHeight: 1.1 }}
                >
                    Trust Infrastructure for{" "}
                    <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        MCP Servers
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="animate-fade-in mx-auto max-w-lg text-center text-base text-slate-400 leading-relaxed sm:text-lg [animation-delay:200ms]">
                    Automated security scanning and certification for the AI agent ecosystem.
                    <br className="hidden sm:block" />
                    Know what your MCP servers are doing — before your users do.
                </p>

                {/* Stats */}
                <div className="animate-fade-in flex flex-wrap items-center justify-center gap-8 pt-2 [animation-delay:250ms]">
                    {[
                        { value: "13,000+", label: "MCP servers" },
                        { value: "6", label: "security checks" },
                        { value: "0", label: "certification standards" },
                    ].map((s) => (
                        <div key={s.label} className="text-center">
                            <div className="text-2xl font-extrabold text-white">{s.value}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="animate-fade-in flex flex-row flex-wrap items-center justify-center gap-3 pt-4 [animation-delay:300ms]">
                    <Button className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700" size="lg">
                        <SearchIcon className="mr-2 size-4" />
                        Scan Your Server — Free
                    </Button>
                    <Button className="rounded-full" size="lg" variant="secondary">
                        How it Works
                        <ArrowRightIcon className="ml-2 size-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}

export function LogosSection() {
    return (
        <section className="relative border-t border-slate-800 py-10 px-4">
            <div className="mx-auto max-w-4xl text-center">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-slate-500">
                    6 Critical Security Checks
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                    {checks.map((check) => (
                        <div
                            key={check.name}
                            className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-4 transition-colors hover:border-emerald-500/30 hover:bg-slate-900"
                        >
                            <span className="text-2xl">{check.icon}</span>
                            <span className="text-center text-xs font-medium text-slate-300 leading-tight">{check.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const checks = [
    { icon: "🌐", name: "Network Exposure" },
    { icon: "💉", name: "Command Injection" },
    { icon: "🔑", name: "Credential Leaks" },
    { icon: "☠️", name: "Tool Poisoning" },
    { icon: "📋", name: "Spec Compliance" },
    { icon: "🛡️", name: "Input Validation" },
];
