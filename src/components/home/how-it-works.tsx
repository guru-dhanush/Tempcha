export function HowItWorks() {
  const steps = [
    { num: '01', title: 'Create a room', desc: 'Set up a room in your dashboard — give it a name, set session duration, and choose your brand color.', icon: '🏗️' },
    { num: '02', title: 'Get your QR', desc: 'Download your permanent QR code. Print it on menus, posters, table tents, or display it on a screen.', icon: '⬛' },
    { num: '03', title: 'Open a session', desc: 'Hit "Open Session" when you\'re ready. Your QR is now live and participants can start joining.', icon: '⚡' },
    { num: '04', title: 'Scan & chat', desc: 'Anyone who scans gets an anonymous alias and joins the live room instantly. No app, no signup.', icon: '💬' },
    { num: '05', title: 'Session ends', desc: 'When the session closes, all messages are deleted. The QR resets — ready for next time.', icon: '🔒' },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-8 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">How it works</h2>
        <p className="text-muted-foreground text-lg">Five steps from setup to live chat</p>
      </div>
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-8 left-0 right-0 h-px hidden lg:block" style={{ background: 'linear-gradient(90deg, transparent, hsl(258 100% 65% / 0.3), hsl(220 100% 60% / 0.3), transparent)' }} />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative z-10 text-2xl"
                style={{ background: 'hsl(224 25% 9%)', border: '1px solid hsl(258 50% 60% / 0.2)', boxShadow: '0 0 20px hsl(258 100% 65% / 0.08)' }}>
                {step.icon}
              </div>
              <div className="text-xs font-bold text-purple-400 mb-1">{step.num}</div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
