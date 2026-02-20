import { HeroSection, LogosSection } from "@/components/ui/hero-1";
import { Header } from "@/components/ui/header-1";

export default function DemoHeroPage() {
    return (
        <div className="flex w-full flex-col">
            <Header />
            <main className="grow">
                <HeroSection />
                <LogosSection />
            </main>
        </div>
    );
}
