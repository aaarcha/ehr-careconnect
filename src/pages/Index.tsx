import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/CareConnectLogo.jpg";
import { Heart, Shield, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-dominant-gradient bg-[length:300%_300%] animate-gradient-shift-slow">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="mx-auto w-32 h-32 rounded-full overflow-hidden">
            <img
              src={logoImage}
              alt="CareConnect Logo"
              className="w-full h-full object-contain drop-shadow-glow"
            />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground drop-shadow-lg">
              CareConnect
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 font-medium">
              Empowering Seamless Care, Connecting Lives
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="shadow-glow hover:scale-105 transition-transform"
          >
            Access System
          </Button>
        </div>
      </div>

      {/* Scrolling Content Section */}
      <div className="bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-16 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-primary">Welcome to CareConnect</h2>
            <p className="text-lg text-foreground/80 italic">
              where technology meets compassion
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-6">
            <p className="text-lg text-foreground/80 leading-relaxed">
              We are proud to provide a seamless, secure, and innovative electronic health record (EHR) system
              designed to connect healthcare professionals, patients, and information in one trusted digital space.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
            At CareConnect, we believe that every click brings care closer - empowering providers to make
            informed decisions, improving communication across teams, and ensuring patients receive the
            quality care they deserve.
            Together, we revolutionize healthcare by connecting people, information, and compassion.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Compliant</h3>
              <p className="text-muted-foreground">
                Your data is protected with enterprise-grade security and compliance standards
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Fast & Efficient</h3>
              <p className="text-muted-foreground">
                Streamlined workflows that save time and improve patient care delivery
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Patient-Centered</h3>
              <p className="text-muted-foreground">
                Designed with both healthcare providers and patients in mind
              </p>
            </div>
          </div>

          <div className="text-center space-y-4 max-w-3xl mx-auto pt-16">
            <h2 className="text-4xl font-bold text-primary">Our Commitment to You</h2>
          </div>

          <div className="max-w-4xl mx-auto pt-16 space-y-12 border-t border-primary/20">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-green-700">VISION</h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                To revolutionize healthcare by connecting people, information, and compassion through a seamless digital platform that inspires trust and improves lives.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-green-700">MISSION</h3>
              <div className="text-lg text-foreground/80 leading-relaxed space-y-4">
                <p>
                  CareConnect is dedicated to enhancing the quality of healthcare through innovation, collaboration, and compassion.
                </p>
                <p className="font-semibold text-foreground">
                  We aim to:
                </p>
                <ul className="list-disc pl-8 mt-2 space-y-2 text-base text-foreground/70">
                  <li>Empower healthcare professionals with accurate, real-time information for better clinical decisions.</li>
                  <li>Strengthen communication between patients and providers through an integrated and user-friendly system.</li>
                  <li>Safeguard data privacy and uphold the highest standards of security and integrity.</li>
                  <li>Continuously innovate to create meaningful digital solutions that improve patient outcomes and experiences.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-green-700">WHY CHOOSE US</h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                At CareConnect, we go beyond digital records - we build connections that care. Our system is designed with healthcare professionals and patients in mind, combining innovation, reliability, and compassion in every feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
