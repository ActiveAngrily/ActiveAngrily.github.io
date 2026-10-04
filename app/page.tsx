import { ContactCopy } from "@/components/contact-copy";
import { IntroCopy } from "@/components/intro-copy";
import { Portfolio } from "@/components/portfolio";
import { SoftSpotlightBackground } from "@/components/soft-spotlight-background";

export default function Home() {
  return (
    <>
      <SoftSpotlightBackground />
      <Portfolio indexContent={<IntroCopy />} contactContent={<ContactCopy />} />
    </>
  );
}
