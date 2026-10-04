import { AnnotatedText } from "./annotated-text";
import { Elsewhere } from "./elsewhere";

export function ContactCopy() {
  return (
    <div className="contact-content">
      <p>
        I’m open to <span className="contact-soft-highlight"><AnnotatedText variant="highlight">working together</AnnotatedText></span>,
        whether that’s a small project or an early-career role. If you have something in mind, send me a note.
      </p>
      <div className="contact-email-line">
        <a className="contact-address" href="mailto:jamuaranant@gmail.com">
          <AnnotatedText variant="underline">jamuaranant@gmail.com</AnnotatedText>
        </a>
      </div>
      <Elsewhere />
    </div>
  );
}
