type Participant = {
  id: string;
  name: string;
};

type ParticipantSelectorProps = {
  currentParticipantId: string;
  participants: Participant[];
  onChange: (participantId: string) => void;
};

export function ParticipantSelector({ currentParticipantId, participants, onChange }: ParticipantSelectorProps) {
  const canSwitch = participants.length > 1;

  return (
    <label className="participant-selector">
      <span>Participant:</span>
      <select value={currentParticipantId} onChange={(event) => onChange(event.target.value)} disabled={!canSwitch} aria-label="Current participant">
        {participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}
      </select>
    </label>
  );
}
