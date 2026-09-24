import { useState } from 'react'
import AppLayout, { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import AppointmentCard, { type AppointmentCardProps } from '../components/AppointmentCard.tsx'
import BackLink from '../components/BackLink.tsx'
import Dialog from '../components/Dialog.tsx'
import Notice from '../components/Notice.tsx'

// Catálogo de 4.7 Citas y diálogos (D9). Página propia, como /kit/resultados:
// sus botones, etiquetas y avatares no entran en las medidas de /kit.
//
// Datos: las cinco citas de Karla (diseño §6) con la copia de las instancias
// de Figma 04.2 y 04.5, sin fotos (su origen está pendiente, DESIGN.md). La
// estructura es la de Mis citas: una sección por grupo, con h2 y una lista, y
// un solo diálogo para toda la página. El almacén real (D13) llega con la
// fase 5; aquí todo se reinicia al recargar.
//
// Copia del diálogo y del aviso: la de Molina es la de Figma (diálogo 284:6558
// y 284:7114; aviso 339:8655 y 339:8871). La de Ruiz y Cortés sigue el mismo
// patrón y, como ella, no promete cancelación sin costo: la cita de Ruiz está
// dentro de las 24 horas (diseño §5.4).

type Status = AppointmentCardProps['status']

type Appointment = {
  id: string
  status: Status
  when: string
  dateTime: string
  name: string
  specialty: string
  location: string
  initial: string
  profileHref: string
  /** Solo en las que se pueden cancelar (Confirmed y Pending). */
  cancel?: { dialogBody: string; noticeBody: string }
}

const PENDING_NOTE = 'El consultorio confirma en menos de 24 horas. Te avisaremos por correo.'

const APPOINTMENTS: Appointment[] = [
  {
    id: 'ruiz-2029-04-24',
    status: 'confirmed',
    when: 'Martes 24 de abril · 10:30',
    dateTime: '2029-04-24T10:30',
    name: 'Dra. Elena Ruiz Arellano',
    specialty: 'Cardiología',
    location: 'Clínica Roma Norte · Ciudad de México',
    initial: 'E',
    profileHref: '/especialistas/elena-ruiz-arellano',
    cancel: {
      dialogBody: 'Martes 24 de abril, 10:30, con la Dra. Elena Ruiz Arellano. Esta acción no se puede deshacer.',
      noticeBody: 'Ya no tienes la cita del martes 24 de abril a las 10:30 con la Dra. Ruiz.',
    },
  },
  {
    id: 'molina-2029-05-08',
    status: 'pending',
    when: 'Martes 8 de mayo · 17:00',
    dateTime: '2029-05-08T17:00',
    name: 'Dr. Andrés Molina Paz',
    specialty: 'Dermatología',
    location: 'Consultorio Del Valle · Ciudad de México',
    initial: 'A',
    profileHref: '/especialistas/andres-molina-paz',
    cancel: {
      dialogBody: 'Martes 8 de mayo, 17:00, con el Dr. Andrés Molina Paz. Esta acción no se puede deshacer.',
      noticeBody: 'Ya no tienes la cita del martes 8 de mayo a las 17:00 con el Dr. Molina.',
    },
  },
  {
    id: 'cortes-2029-05-16',
    status: 'confirmed',
    when: 'Miércoles 16 de mayo · 09:30',
    dateTime: '2029-05-16T09:30',
    name: 'Dr. Iván Cortés Naranjo',
    specialty: 'Oftalmología',
    location: 'Clínica Polanco · Ciudad de México',
    initial: 'I',
    profileHref: '/especialistas/ivan-cortes-naranjo',
    cancel: {
      dialogBody: 'Miércoles 16 de mayo, 09:30, con el Dr. Iván Cortés Naranjo. Esta acción no se puede deshacer.',
      noticeBody: 'Ya no tienes la cita del miércoles 16 de mayo a las 09:30 con el Dr. Cortés.',
    },
  },
  {
    id: 'ibarra-2029-03-12',
    status: 'past',
    when: 'Lunes 12 de marzo · 09:00',
    dateTime: '2029-03-12T09:00',
    name: 'Dr. Tomás Ibarra Solís',
    specialty: 'Medicina general',
    location: 'Clínica Roma Norte · Ciudad de México',
    initial: 'T',
    profileHref: '/especialistas/tomas-ibarra-solis',
  },
  {
    id: 'serrano-2029-02-22',
    status: 'cancelled',
    when: 'Jueves 22 de febrero · 12:30',
    dateTime: '2029-02-22T12:30',
    name: 'Dra. Paula Serrano Vidal',
    specialty: 'Nutrición clínica',
    location: 'Consultorio Nápoles · Ciudad de México',
    initial: 'P',
    profileHref: '/especialistas/paula-serrano-vidal',
  },
]

type Target = { appointment: Appointment; trigger: HTMLButtonElement }

function cardProps(appointment: Appointment, onCancel: (trigger: HTMLButtonElement) => void): AppointmentCardProps {
  const { status, when, dateTime, name, specialty, location, initial } = appointment
  const common = { when, dateTime, name, specialty, location, initial }
  if (status === 'confirmed') return { ...common, status, rescheduleHref: `/mis-citas/${appointment.id}/reprogramar`, onCancel }
  if (status === 'pending') return { ...common, status, pendingNote: PENDING_NOTE, onCancel }
  return { ...common, status, bookHref: appointment.profileHref }
}

const isUpcoming = (a: Appointment) => a.status === 'confirmed' || a.status === 'pending'

export default function KitAppointments() {
  const [appointments, setAppointments] = useState(APPOINTMENTS)
  const [target, setTarget] = useState<Target | null>(null)
  const [notice, setNotice] = useState<{ id: string; body: string } | null>(null)

  // Próximas en orden ascendente; Pasadas, descendente, con las canceladas.
  const upcoming = appointments.filter(isUpcoming).sort((a, b) => a.dateTime.localeCompare(b.dateTime))
  const past = appointments.filter((a) => !isUpcoming(a)).sort((a, b) => b.dateTime.localeCompare(a.dateTime))

  const card = (appointment: Appointment) => (
    <AppointmentCard {...cardProps(appointment, (trigger) => setTarget({ appointment, trigger }))} key={appointment.id} />
  )

  const confirmCancel = () => {
    if (!target?.appointment.cancel) return
    const { id, cancel } = target.appointment
    setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)))
    setNotice({ id, body: cancel.noticeBody })
    setTarget(null)
  }

  return (
    <AppLayout>
      <div className="c-kit">
        <div className="o-stack o-stack--gap-4">
          <h1 className="c-kit__title" id={MAIN_TITLE_ID} tabIndex={-1}>
            Citas y diálogos
          </h1>
          <p>
            <BackLink href="/kit">Kit del sistema</BackLink>
          </p>
          <p>
            Appointment Card en los cuatro estados, con la estructura de Mis citas. Stacked por
            defecto; Row cuando el li alcanza 40rem. «Cancelar cita» abre el diálogo destructivo;
            al confirmar, la cita pasa a Pasadas y el foco va al título del aviso.
          </p>
          {/* Con 0 citas próximas no hay subtítulo ni sección: no está en el diseño (DESIGN.md, Pendientes, fase 5). */}
          {upcoming.length > 0 && (
            <p id="kit-subtitulo">{upcoming.length === 1 ? 'Tienes 1 cita próxima' : `Tienes ${upcoming.length} citas próximas`}</p>
          )}
        </div>

        {notice && (
          <Notice
            key={notice.id}
            tone="success"
            delivery="focus"
            headingLevel={2}
            title="Cita cancelada"
            body={notice.body}
            onDismiss={() => setNotice(null)}
          />
        )}

        {upcoming.length > 0 && (
          <section className="c-kit__section" aria-labelledby="kit-proximas-titulo">
            <h2 className="c-kit__heading" id="kit-proximas-titulo">
              Próximas
            </h2>
            <ul className="o-stack o-stack--gap-4" role="list" id="kit-proximas">
              {upcoming.map(card)}
            </ul>
          </section>
        )}

        <section className="c-kit__section" aria-labelledby="kit-pasadas-titulo">
          <h2 className="c-kit__heading" id="kit-pasadas-titulo">
            Pasadas
          </h2>
          <ul className="o-stack o-stack--gap-4" role="list" id="kit-pasadas">
            {past.map(card)}
          </ul>
        </section>

        <Dialog
          open={target !== null}
          title="¿Cancelar esta cita?"
          body={target?.appointment.cancel?.dialogBody}
          dismissLabel="Mantener mi cita"
          confirmLabel="Cancelar cita"
          returnFocus={target?.trigger ?? null}
          onDismiss={() => setTarget(null)}
          onConfirm={confirmCancel}
        />
      </div>
    </AppLayout>
  )
}
