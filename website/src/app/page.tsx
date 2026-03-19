import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import Hero from '@/sections/Hero';
import MarketStats from '@/sections/MarketStats';
import Features from '@/sections/Features';
import AutoConvert from '@/sections/AutoConvert';
import UseCases from '@/sections/UseCases';
import Services from '@/sections/Services';
import AppsOverview from '@/sections/AppsOverview';
import Counter from '@/sections/Counter';
import Pricing from '@/sections/Pricing';
import WorkProgress from '@/sections/WorkProgress';
import SupportedCryptos from '@/sections/SupportedCryptos';
import Testimonials from '@/sections/Testimonials';
import FAQ from '@/sections/FAQ';
import Developers from '@/sections/Developers';
import Contact from '@/sections/Contact';
import Partners from '@/sections/Partners';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <MarketStats />
        <Features />
        <AutoConvert />
        <UseCases />
        <Services />
        <AppsOverview />
        <Counter />
        <Pricing />
        <WorkProgress />
        <SupportedCryptos />
        <Testimonials />
        <FAQ />
        <Developers />
        <Contact />
        <Partners />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
