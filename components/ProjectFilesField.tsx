"use client";

import { ChangeEvent, useState } from "react";
import { PROJECT_FILE_LIMIT_BYTES, PROJECT_FILES } from "@/lib/discovery";

type Props = {
  files: Record<string, string>;
  onChange: (fileId: string, text: string) => void;
};

const LIMIT_KB = PROJECT_FILE_LIMIT_BYTES / 1024;

export default function ProjectFilesField({ files, onChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const setError = (fileId: string, message: string) => setErrors((e) => ({ ...e, [fileId]: message }));

  async function readFile(fileId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > PROJECT_FILE_LIMIT_BYTES) {
      setError(fileId, `This file is larger than ${LIMIT_KB} KB. Paste the relevant part instead.`);
      return;
    }
    try {
      onChange(fileId, await file.text());
      setError(fileId, "");
    } catch {
      setError(fileId, "The file could not be read. Paste its contents instead.");
    }
  }

  return (
    <div className="project-files">
      <span className="field-title">Upload or paste ProjectSettings/ProjectVersion.txt and Packages/manifest.json</span>
      {PROJECT_FILES.map((f) => (
        <div className="field" key={f.id}>
          <div className="project-file-head">
            <label htmlFor={`pf-${f.id}`}>{f.label}</label>
            <label className="btn upload-btn">
              Upload
              <input type="file" accept=".txt,.json,text/plain,application/json" onChange={(e) => readFile(f.id, e)} />
            </label>
          </div>
          <textarea
            id={`pf-${f.id}`}
            className="mono-text"
            placeholder={`Paste ${f.label} here (up to ${LIMIT_KB} KB)`}
            value={files[f.id] ?? ""}
            onChange={(e) => onChange(f.id, e.target.value.slice(0, PROJECT_FILE_LIMIT_BYTES))}
          />
          {errors[f.id] && <span className="hint warn-text">{errors[f.id]}</span>}
        </div>
      ))}
    </div>
  );
}
