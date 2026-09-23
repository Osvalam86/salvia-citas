import calendarBlankUrl from '../assets/icons/calendar-blank.svg'
import AppLayout from '../components/AppLayout.tsx'
import BackLink from '../components/BackLink.tsx'
import Button, { type ButtonProps } from '../components/Button.tsx'
import Icon from '../components/Icon.tsx'
import IconButton from '../components/IconButton.tsx'
import Link from '../components/Link.tsx'
import { ICON_NAMES } from '../components/iconNames.ts'

// Catálogo del sistema (D9): va también en producción. Crece con cada fase;
// en la 2 muestra los pasos tipográficos, los enlaces base y el anillo de foco;
// en la 3, el shell con los dos patrones de aside (/kit/layout); en la 4, los
// componentes del kit por sección. Hover y foco se muestran reales, no
// simulados con clases.

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
  {
    step: 'page-title',
    figma: 'page-title (derivado): heading/lg; display desde lg',
    sample: 'Tu cita está reservada',
  },
]

const buttonStyles: { variant: NonNullable<ButtonProps['variant']>; name: string }[] = [
  { variant: 'primary', name: 'Primary' },
  { variant: 'secondary', name: 'Secondary' },
  { variant: 'destructive', name: 'Destructive' },
]

export default function Kit() {
  return (
    <AppLayout>
      <div className="c-kit">
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
                <Link href="#kit-enlaces">Ir a Enlaces</Link>
              </p>
            </div>
            <div className="c-kit__swatch c-kit__swatch--muted">
              <p className="c-kit__sample-label">Sobre color-surface-muted</p>
              <p>
                <Link href="#kit-enlaces">Ir a Enlaces</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-iconos">
          <h2 className="c-kit__heading" id="kit-iconos">
            Iconos
          </h2>
          <p>
            Phosphor Regular, lista cerrada de 19. Decorativos: el nombre lo da el texto o el control.
          </p>
          <ul className="o-cluster o-cluster--gap-5 o-cluster--align-start" role="list">
            {ICON_NAMES.map((name) => (
              <li className="o-stack o-stack--gap-1" key={name}>
                <Icon name={name} size={24} />
                <span className="c-kit__meta">{name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-acciones">
          <h2 className="c-kit__heading" id="kit-acciones">
            Acciones
          </h2>

          <h3 className="c-kit__subheading">Button</h3>
          {buttonStyles.map(({ variant, name }) => (
            <div className="o-stack o-stack--gap-2" key={variant}>
              <p className="c-kit__meta">{name}</p>
              <div className="o-cluster o-cluster--gap-3 o-cluster--align-center">
                <Button variant={variant}>Buscar</Button>
                <Button variant={variant} leadingIcon="magnifying-glass">
                  Buscar
                </Button>
                <Button variant={variant} trailingIcon="caret-right">
                  Siguiente
                </Button>
                <Button variant={variant} leadingIcon="calendar-dots" trailingIcon="caret-down">
                  Ver mes completo
                </Button>
              </div>
            </div>
          ))}
          <div className="o-stack o-stack--gap-2">
            <p className="c-kit__meta">Como enlace: ruta interna y descarga</p>
            <div className="o-cluster o-cluster--gap-3 o-cluster--align-center">
              <Button variant="secondary" href="/kit/layout?aside=inicio&lineas=1">
                Ver la demo del shell
              </Button>
              <Button
                variant="secondary"
                href={calendarBlankUrl}
                download="calendar-blank.svg"
                leadingIcon="calendar-blank"
              >
                Descargar calendar-blank.svg
              </Button>
            </div>
          </div>
          <div className="o-stack o-stack--gap-2">
            <p className="c-kit__meta">A ancho completo: la etiqueta parte en líneas</p>
            <Button variant="secondary" className="c-kit__fill">
              Avisarme si se libera un hueco
            </Button>
          </div>

          <h3 className="c-kit__subheading">Icon Button</h3>
          <div className="o-cluster o-cluster--gap-2 o-cluster--align-center">
            <IconButton icon="x" label="Cerrar" />
            <IconButton icon="caret-left" label="Mes anterior" />
            <IconButton icon="caret-right" label="Mes siguiente" />
          </div>

          <h3 className="c-kit__subheading">Link y Back Link</h3>
          <div className="o-cluster o-cluster--gap-5 o-cluster--align-center">
            <Link href="#kit-tipografia">Ir a Tipografía</Link>
            <BackLink href="/">Especialistas</BackLink>
          </div>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-layout">
          <h2 className="c-kit__heading" id="kit-layout">
            Layout
          </h2>
          <p>
            Shell con barra inferior y los dos patrones de aside. La barra de demo cambia de alto
            para comprobar que el foco nunca queda debajo de ella.
          </p>
          <ul className="o-stack o-stack--gap-2" role="list">
            <li>
              <Link href="/kit/layout?aside=inicio&lineas=1">Aside al inicio, barra de una línea</Link>
            </li>
            <li>
              <Link href="/kit/layout?aside=fin&lineas=3">Aside al final, barra de tres líneas</Link>
            </li>
          </ul>
        </section>
      </div>
    </AppLayout>
  )
}
