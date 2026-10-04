import { AnnotatedText } from "./annotated-text";
import { Elsewhere } from "./elsewhere";

function ProjectLink({ project }: { project: "red-letter" | "curieon" }) {
  const red = project === "red-letter";
  return (
    <a
      className={`project-link ${project}`}
      href={red ? "https://redletter.cc.cd/" : "https://curieon.tech"}
      target="_blank"
      rel="noreferrer"
    >
      <AnnotatedText variant="highlight">
        <img className="inline-brand-mark" src={`/brands/${project}-mark.svg`} alt="" width="16" height="16" />
        {red ? "Red Letter" : "Curieon"}
      </AnnotatedText>
    </a>
  );
}

export function IntroCopy() {
  return (
    <div>
      <p>
        I’m <span className="name"><AnnotatedText variant="underline">Anant</AnnotatedText></span>,
        a developer in <span className="location"><AnnotatedText variant="highlight">Bengaluru</AnnotatedText></span>.{" "}
        <span className="project-phrase">I’m building <ProjectLink project="red-letter" /></span> to bring the news together,{" "}
        <span className="project-phrase">and <ProjectLink project="curieon" /></span> to help care teams triage patients.
        Outside of that, I spend most of my time writing or listening to music.
      </p>
      <Elsewhere />
    </div>
  );
}
