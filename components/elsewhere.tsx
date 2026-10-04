import { Fragment } from "react";
import { AnnotatedText } from "./annotated-text";

const profiles = [
  ["Substack", "https://jamuaranant.substack.com/"],
  ["Spotify", "https://sptfy.in/jok0"],
  ["GitHub", "https://github.com/ActiveAngrily"],
  ["LinkedIn", "https://www.linkedin.com/in/jamuaranant/"],
  ["X", "https://x.com/AnantJamuar"],
];

export function Elsewhere() {
  return (
    <div className="elsewhere" aria-label="Elsewhere">
      <span className="elsewhere-label">Elsewhere:</span>
      {profiles.map(([name, href], index) => (
        <Fragment key={name}>
          {index > 0 && <span className="social-separator" aria-hidden="true">·</span>}
          <a href={href} target="_blank" rel="noreferrer" className="social-link">
            <AnnotatedText variant="underline">{name}</AnnotatedText>
          </a>
        </Fragment>
      ))}
    </div>
  );
}
