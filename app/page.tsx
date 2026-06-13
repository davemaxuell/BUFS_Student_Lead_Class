"use client";

import { LanguageProvider, S, useLang } from "@/lib/i18n";
import Header from "@/components/Header";
import NeuralNetBasics from "@/components/NeuralNetBasics";
import ClassificationTrainer from "@/components/ClassificationTrainer";
import BackpropSequence from "@/components/BackpropSequence";
import MLMDemo from "@/components/MLMDemo";
import TokenEmbedding from "@/components/TokenEmbedding";
import EmbeddingViz from "@/components/EmbeddingViz";
import Embed3D from "@/components/Embed3D";
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

function GroupHeader({ g, n }: { g: keyof typeof S.groups; n: number }) {
  const { lang } = useLang();
  const grp = S.groups[g];
  return (
    <div className="group-header">
      <div className="container">
        <span className="group-num">{n}</span>
        <h2 className="group-title">{grp.title[lang]}</h2>
        <p className="group-sub">{grp.sub[lang]}</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <LanguageProvider>
      <Header />
      <main>
        <GroupHeader g="foundations" n={1} />
        <NeuralNetBasics />
        <ClassificationTrainer />
        <BackpropSequence />

        <GroupHeader g="tokenizer" n={2} />
        <BPETrainer />

        <GroupHeader g="encoder" n={3} />
        <MLMDemo />

        <GroupHeader g="embeddings" n={4} />
        <TokenEmbedding />
        <EmbeddingViz />
        <Embed3D />

        <GroupHeader g="tokenization" n={5} />
        <TokenTaxHero />
        <TokenizationComparison />
        <RealTokenizers />
        <NormalizationVisualizer />
        <LowResourceTax />

        <GroupHeader g="reference" n={6} />
        <Glossary />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
