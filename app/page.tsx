"use client";

import { LanguageProvider, S, useLang } from "@/lib/i18n";
import Header from "@/components/Header";
import NeuralNetBasics from "@/components/NeuralNetBasics";
import ClassificationTrainer from "@/components/ClassificationTrainer";
import BackpropSequence from "@/components/BackpropSequence";
import EmbeddingViz from "@/components/EmbeddingViz";
import BPETrainer from "@/components/BPETrainer";
import TokenTaxHero from "@/components/TokenTaxHero";
import TokenizationComparison from "@/components/TokenizationComparison";
import RealTokenizers from "@/components/RealTokenizers";
import NormalizationVisualizer from "@/components/NormalizationVisualizer";
import LowResourceTax from "@/components/LowResourceTax";
import Glossary from "@/components/Glossary";

function Footer() {
  const { lang } = useLang();
  return (
    <footer className="footer">
      <div className="container">
        <p>{S.footer.builtFor[lang]}</p>
        <p>{S.footer.source[lang]}</p>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <LanguageProvider>
      <Header />
      <main>
        <NeuralNetBasics />
        <ClassificationTrainer />
        <BackpropSequence />
        <EmbeddingViz />
        <BPETrainer />
        <TokenTaxHero />
        <TokenizationComparison />
        <RealTokenizers />
        <NormalizationVisualizer />
        <LowResourceTax />
        <Glossary />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
