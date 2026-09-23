// Catálogo del sistema (D9): va también en producción. Crece con cada fase;
// en la 2 muestra los pasos tipográficos, los enlaces base y el anillo de foco.

const steps = [
  { step: 'display', figma: 'display', sample: 'Encuentra a tu especialista' },
  { step: 'heading-lg', figma: 'heading/lg', sample: 'Elige fecha y hora' },
  { step: 'heading-md', figma: 'heading/md', sample: 'Próximas citas' },
  { step: 'heading-sm', figma: 'heading/sm', sample: 'Dra. Elena Ruiz Arellano' },
  {
    step: 'body-md',
    figma: 'body/md',
    sample: 'Consulta de cardiología en Clínica Roma Norte, martes 24 de abril a las 10:30.',
  },
  { step: 'body-strong', figma: 'body/strong', sample: 'Martes 24 de abril, 10:30' },
  { step: 'label', figma: 'label', sample: 'Especialidad' },
  {
    step: 'caption',
    figma: 'caption',
    sample: 'Te enviaremos la confirmación a karla.sanchez@ejemplo.com.',
  },
]

export default function Kit() {
  return (
    <main className="c-kit">
      <h1 className="c-kit__title">Kit del sistema</h1>

      <section className="c-kit__section" aria-labelledby="kit-tipografia">
        <h2 className="c-kit__heading" id="kit-tipografia">
          Tipografía
        </h2>
        <ul className="c-kit__specimens" role="list">
          {steps.map(({ step, figma, sample }) => (
            <li className="c-kit__specimen" key={step}>
              <p className="c-kit__meta">{figma}</p>
              <p className={`c-kit__sample-${step}`}>{sample}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="c-kit__section" aria-labelledby="kit-enlaces">
        <h2 className="c-kit__heading" id="kit-enlaces">
          Enlaces
        </h2>
        <p>
          Enlace dentro de un párrafo en body/md: <a href="#kit-tipografia">volver a Tipografía</a>.
        </p>
        <p className="c-kit__sample-caption">
          Enlace dentro de un texto en caption: <a href="#kit-foco">ir a Foco</a>.
        </p>
      </section>

      <section className="c-kit__section" aria-labelledby="kit-foco">
        <h2 className="c-kit__heading" id="kit-foco">
          Foco
        </h2>
        <div className="c-kit__swatches">
          <div className="c-kit__swatch">
            <p className="c-kit__sample-label">Sobre color-surface</p>
            <p>
              <a href="#kit-enlaces">Ir a Enlaces</a>
            </p>
          </div>
          <div className="c-kit__swatch c-kit__swatch--muted">
            <p className="c-kit__sample-label">Sobre color-surface-muted</p>
            <p>
              <a href="#kit-enlaces">Ir a Enlaces</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
