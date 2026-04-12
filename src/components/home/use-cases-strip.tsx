export function UseCasesStrip() {
  const cases = [
    { icon: '🍽️', label: 'Restaurants', desc: 'Table chat & feedback' },
    { icon: '🏨', label: 'Hotels', desc: 'Guest room service' },
    { icon: '🎤', label: 'Conferences', desc: 'Live Q&A rooms' },
    { icon: '🏫', label: 'Classrooms', desc: 'Anonymous Q&A' },
    { icon: '🏥', label: 'Clinics', desc: 'Waiting room chat' },
    { icon: '🎪', label: 'Events', desc: 'Attendee coordination' },
    { icon: '🏢', label: 'Offices', desc: 'Meeting room chat' },
    { icon: '🛍️', label: 'Retail', desc: 'In-store feedback' },
    { icon: '🚌', label: 'Transport', desc: 'Tour & transit rooms' },
    { icon: '⚽', label: 'Sports', desc: 'Team coordination' },
  ];

  return (
    <section id="usecases" className="py-12 border-y overflow-hidden" style={{ borderColor: 'hsl(224 20% 11%)' }}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Works everywhere</h2>
        <p className="text-muted-foreground">Any physical space that needs real-time group communication</p>
      </div>
      <div className="flex gap-4 px-8 flex-wrap justify-center max-w-5xl mx-auto">
        {cases.map((c) => (
          <div key={c.label} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition-all hover:scale-105 cursor-default"
            style={{ background: 'hsl(224 25% 9%)', border: '1px solid hsl(224 20% 14%)' }}>
            <span className="text-xl">{c.icon}</span>
            <div>
              <div className="font-medium text-foreground text-sm">{c.label}</div>
              <div className="text-muted-foreground text-xs">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
