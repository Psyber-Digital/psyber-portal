"use client";

import { useFormState } from "react-dom";
import { addRecording, saveClinicSettings, type ClinicResult } from "./actions";

const initial: ClinicResult = {};

function Message({ state }: { state: ClinicResult }) {
  if (state.error) return <p className="mt-3 text-sm text-[#f0a99f]">{state.error}</p>;
  if (state.ok) return <p className="mt-3 text-sm text-blue">{state.ok}</p>;
  return null;
}

export function SettingsForm({ zoom, notice }: { zoom: string; notice: string }) {
  const [state, action] = useFormState(saveClinicSettings, initial);
  return (
    <form action={action} className="psy-card p-6">
      <label className="psy-label">Zoom link (the recurring meeting)</label>
      <input name="zoom_url" defaultValue={zoom} className="psy-input" placeholder="https://us02web.zoom.us/j/…" />
      <label className="psy-label">Notice for members (cancellations, changes). Leave empty to hide.</label>
      <input name="notice" defaultValue={notice} className="psy-input" placeholder="This week's drop-in moves to Thursday, same time." />
      <button className="psy-btn mt-4">Save</button>
      <Message state={state} />
    </form>
  );
}

export function RecordingForm() {
  const [state, action] = useFormState(addRecording, initial);
  return (
    <form action={action} className="psy-card p-6">
      <label className="psy-label">Drop-in date</label>
      <input name="clinic_date" type="date" className="psy-input" />
      <label className="psy-label">Vimeo link or video number</label>
      <input name="vimeo" className="psy-input" placeholder="https://vimeo.com/123456789/abcdef1234" />
      <label className="psy-label">Title (optional)</label>
      <input name="title" className="psy-input" placeholder="Niches and first messages" />
      <button className="psy-btn mt-4">Add recording</button>
      <Message state={state} />
    </form>
  );
}
