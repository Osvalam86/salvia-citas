import { useId, useState } from 'react'
import calendarBlankUrl from '../assets/icons/calendar-blank.svg'
import AppLayout, { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import Avatar from '../components/Avatar.tsx'
import BackLink from '../components/BackLink.tsx'
import Breadcrumb from '../components/Breadcrumb.tsx'
import Button, { type ButtonProps } from '../components/Button.tsx'
import Checkbox from '../components/Checkbox.tsx'
import FieldSelect from '../components/FieldSelect.tsx'
import FieldText from '../components/FieldText.tsx'
import Icon from '../components/Icon.tsx'
import IconButton from '../components/IconButton.tsx'
import Legend from '../components/Legend.tsx'
import Link from '../components/Link.tsx'
import Menu from '../components/Menu.tsx'
import MenuItem from '../components/MenuItem.tsx'
import NavItem from '../components/NavItem.tsx'
import NavLink from '../components/NavLink.tsx'
import Radio from '../components/Radio.tsx'
import Notice from '../components/Notice.tsx'
import StatusTag from '../components/StatusTag.tsx'
import Step from '../components/Step.tsx'
import Tag from '../components/Tag.tsx'
import { PATHS } from '../components/destinations.ts'
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

// Copy de la vista 3 y de los filtros (Figma). Del motivo de consulta el
// diseño solo nombra «Primera consulta»: el resto de opciones llega con los
// datos de la fase 5.
const MOTIVOS = [{ value: 'primera', label: 'Primera consulta' }] as const
const DISPONIBILIDAD = ['Cualquier fecha', 'Hoy', 'Esta semana', 'Este mes'] as const

function FormDemos() {
  const helpId = useId()

  return (
    <>
      <h3 className="c-kit__subheading">Field/Text</h3>
      <div className="o-stack o-stack--gap-5">
        <FieldText
          label="Correo electrónico"
          name="kit-correo"
          type="email"
          autoComplete="email"
          required
          placeholder="nombre@ejemplo.com"
          hint="Te enviaremos el comprobante de la cita"
        />
        <FieldText
          label="Correo electrónico"
          name="kit-correo-error"
          type="email"
          autoComplete="email"
          defaultValue="karla@"
          error="Escribe un correo válido, con @ y dominio"
        />
        <FieldText
          label="Teléfono (opcional)"
          name="kit-telefono"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          hint="10 dígitos. Te llamamos solo si hay un cambio"
        />
      </div>

      <h3 className="c-kit__subheading">Field/Select</h3>
      <div className="o-stack o-stack--gap-5">
        <FieldSelect
          label="Motivo de consulta"
          name="kit-motivo"
          options={MOTIVOS}
          placeholder="Elige una opción"
          hint="Nos ayuda a preparar tu consulta"
        />
        <FieldSelect
          label="Motivo de consulta"
          name="kit-motivo-error"
          options={MOTIVOS}
          placeholder="Elige una opción"
          error="Elige el motivo de tu consulta"
        />
        <FieldSelect
          label="Motivo de consulta"
          name="kit-motivo-lleno"
          options={MOTIVOS}
          placeholder="Elige una opción"
          defaultValue="primera"
          hint="Nos ayuda a preparar tu consulta"
        />
      </div>

      <h3 className="c-kit__subheading">Checkbox y Legend Section</h3>
      <fieldset className="o-stack o-stack--gap-1" aria-describedby={helpId}>
        <Legend
          level="section"
          helpId={helpId}
          help="Todos los campos son obligatorios salvo los marcados como opcionales"
        >
          Antes de confirmar
        </Legend>
        <div className="o-stack o-stack--gap-0">
          <Checkbox
            label="Acepto el aviso de privacidad"
            name="kit-privacidad"
            error="Debes aceptar el aviso para continuar"
          />
          <Checkbox
            label="Quiero un recordatorio por correo el día anterior"
            name="kit-recordatorio"
            defaultChecked
            hint="Lo enviamos 24 horas antes de tu cita"
          />
          <Checkbox label="Cardiología" name="kit-especialidad" />
        </div>
      </fieldset>

      <h3 className="c-kit__subheading">Radio y Legend Group</h3>
      <fieldset className="o-stack o-stack--gap-1">
        <Legend level="group">Disponibilidad</Legend>
        <div className="o-stack o-stack--gap-0">
          {DISPONIBILIDAD.map((label, index) => (
            <Radio label={label} name="kit-disponibilidad" value={label} defaultChecked={index === 0} key={label} />
          ))}
        </div>
      </fieldset>

      <h3 className="c-kit__subheading">Legend con encabezado (D14)</h3>
      <fieldset className="o-stack o-stack--gap-4">
        <Legend level="section" headingLevel={3}>
          Elige fecha
        </Legend>
        <FieldText label="Nombre completo" name="kit-nombre" autoComplete="name" hint="Como aparece en tu identificación" />
      </fieldset>
    </>
  )
}

// Las dos formas de entregar un aviso de resultado (diseño §4.6).
function NoticeDemos() {
  const [liveOpen, setLiveOpen] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  return (
    <>
      <div className="o-stack o-stack--gap-2">
        <p className="c-kit__meta">
          Región viva: el disparador sigue en pantalla y el foco se queda en él
        </p>
        <div className="o-cluster o-cluster--gap-3 o-cluster--align-center">
          <Button variant="secondary" onClick={() => setLiveOpen(true)}>
            Avisarme si se libera un hueco
          </Button>
        </div>
        <Notice
          tone="success"
          delivery="live"
          open={liveOpen}
          headingLevel={4}
          title="Aviso activado"
          body="Te avisaremos por correo si se libera un hueco con la Dra. Ruiz."
          onDismiss={() => setLiveOpen(false)}
        />
      </div>
      <div className="o-stack o-stack--gap-2">
        <p className="c-kit__meta">Foco: el disparador desaparece y el foco pasa al título</p>
        {cancelled ? (
          <Notice
            tone="error"
            delivery="focus"
            headingLevel={4}
            title="Cita cancelada"
            body="Ya no tienes la cita del martes 8 de mayo a las 17:00 con el Dr. Molina."
            onDismiss={() => setCancelled(false)}
          />
        ) : (
          <div className="o-cluster o-cluster--gap-3 o-cluster--align-center">
            <Button variant="secondary" onClick={() => setCancelled(true)}>
              Cancelar la cita de ejemplo
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

// Piezas sueltas de la navegación. Los headers y la barra inferior se ven en
// su sitio, con el chrome real, en /kit/navegacion.
function NavDemos() {
  const menuId = useId()

  return (
    <>
      <h3 className="c-kit__subheading">Breadcrumb</h3>
      <div className="o-stack o-stack--gap-2">
        <p className="c-kit__meta">Levels=3</p>
        <Breadcrumb
          levels={[
            { label: 'Especialistas', href: PATHS.especialistas },
            { label: 'Dra. Ruiz', href: '/especialistas/elena-ruiz-arellano' },
          ]}
          current="Tus datos"
        />
        <p className="c-kit__meta">Levels=2</p>
        <Breadcrumb levels={[{ label: 'Especialistas', href: PATHS.especialistas }]} current="Dra. Ruiz" />
      </div>

      <h3 className="c-kit__subheading">Nav Link</h3>
      <p>Sueltos miden 48; en el header ocupan todo su alto.</p>
      <ul className="o-cluster o-cluster--gap-2 o-cluster--align-center" role="list">
        <li>
          <NavLink href={PATHS.especialistas} current>
            Especialistas
          </NavLink>
        </li>
        <li>
          <NavLink href={PATHS.misCitas}>Mis citas</NavLink>
        </li>
      </ul>

      <h3 className="c-kit__subheading">Nav Item</h3>
      <ul className="o-cluster o-cluster--gap-2 o-cluster--align-start" role="list">
        <li>
          <NavItem href={PATHS.especialistas} icon="magnifying-glass" current>
            Especialistas
          </NavItem>
        </li>
        <li>
          <NavItem href={PATHS.misCitas} icon="calendar-check">
            Mis citas
          </NavItem>
        </li>
      </ul>

      <h3 className="c-kit__subheading">Menu y Menu Item</h3>
      <p>Panel abierto, fuera de su disparador. El comportamiento, en el header de la demo.</p>
      <Menu id={menuId} open onSelect={() => {}} className="c-kit__menu">
        <MenuItem href={PATHS.fueraDeAlcance}>Cuenta</MenuItem>
        <MenuItem onSelect={() => {}}>Cerrar sesión</MenuItem>
      </Menu>

      <h3 className="c-kit__subheading">Headers y Bottom Nav</h3>
      <ul className="o-stack o-stack--gap-2" role="list">
        <li>
          <Link href="/kit/navegacion?sesion=iniciada&actual=especialistas">Chrome real, sesión iniciada</Link>
        </li>
        <li>
          <Link href="/kit/navegacion?sesion=invitado&actual=especialistas">Chrome real, invitado</Link>
        </li>
      </ul>
    </>
  )
}

export default function Kit() {
  return (
    <AppLayout>
      <div className="c-kit">
        <h1 className="c-kit__title" id={MAIN_TITLE_ID} tabIndex={-1}>
          Kit del sistema
        </h1>

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

        <section className="c-kit__section" aria-labelledby="kit-identidad">
          <h2 className="c-kit__heading" id="kit-identidad">
            Identidad y estado
          </h2>

          <h3 className="c-kit__subheading">Avatar</h3>
          <p>Solo el respaldo de la inicial: las fotos esperan a decidir su origen.</p>
          <div className="o-cluster o-cluster--gap-4 o-cluster--align-end">
            <Avatar size="small" initial="E" />
            <Avatar size="medium" initial="E" />
            <Avatar size="large" initial="E" />
          </div>

          <h3 className="c-kit__subheading">Tag</h3>
          <div className="o-cluster o-cluster--gap-2 o-cluster--align-center">
            <Tag>Presencial</Tag>
            <Tag>Presencial y videoconsulta</Tag>
          </div>

          <h3 className="c-kit__subheading">Status Tag</h3>
          <div className="o-cluster o-cluster--gap-2 o-cluster--align-center">
            <StatusTag status="confirmed" />
            <StatusTag status="pending" />
            <StatusTag status="past" />
            <StatusTag status="cancelled" />
          </div>

          <h3 className="c-kit__subheading">Step</h3>
          <ol
            className="o-cluster o-cluster--gap-4 o-cluster--align-center"
            role="list"
            aria-label="Pasos de la reserva"
          >
            <Step state="done" number={1} label="Fecha y hora" />
            <Step state="current" number={2} label="Tus datos" />
            <Step state="upcoming" number={3} label="Listo" />
          </ol>

          <h3 className="c-kit__subheading">Notice</h3>
          <Notice
            tone="info"
            headingLevel={4}
            icon="calendar-check"
            title="Tu cita actual"
            body="Miércoles 16 de mayo · 09:30. Al confirmar, esa hora se libera."
          />
          <NoticeDemos />
        </section>

        <section className="c-kit__section" aria-labelledby="kit-formulario">
          <h2 className="c-kit__heading" id="kit-formulario">
            Formulario
          </h2>
          <p>Estados reales: hover, foco y error con aria-invalid. La validación es al enviar.</p>
          <FormDemos />
        </section>

        <section className="c-kit__section" aria-labelledby="kit-navegacion">
          <h2 className="c-kit__heading" id="kit-navegacion">
            Navegación
          </h2>
          <NavDemos />
        </section>

        <section className="c-kit__section" aria-labelledby="kit-resultados">
          <h2 className="c-kit__heading" id="kit-resultados">
            Búsqueda y resultados
          </h2>
          <p>Result Card, Filter Trigger, Pagination, Page Link y Load More, en su propia página.</p>
          <p>
            <Link href="/kit/resultados">Ver búsqueda y resultados</Link>
          </p>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-fecha-hora">
          <h2 className="c-kit__heading" id="kit-fecha-hora">
            Fecha y hora
          </h2>
          <p>Day Chip, Calendar, Calendar Day, Time Slot y Booking Bar, en su propia página.</p>
          <p>
            <Link href="/kit/fecha-hora">Ver fecha y hora</Link>
          </p>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-citas">
          <h2 className="c-kit__heading" id="kit-citas">
            Citas y diálogos
          </h2>
          <p>Appointment Card en su propia página.</p>
          <p>
            <Link href="/kit/citas">Ver citas y diálogos</Link>
          </p>
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
