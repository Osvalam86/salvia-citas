import { parseDate } from '@internationalized/date'
import { useId, useState } from 'react'
import AppointmentCard, { type AppointmentCardProps } from '../components/AppointmentCard.tsx'
import Button from '../components/Button.tsx'
import Dialog from '../components/Dialog.tsx'
import Notice from '../components/Notice.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { PATHS } from '../components/destinations.ts'
import { dayTitle } from '../components/dates.ts'
import {
  appointmentStore,
  cancelCopy,
  groupAppointments,
  PENDING_NOTE,
  upcomingText,
  useAppointments,
  type Appointment,
} from '../data/appointments.ts'
import { PHOTOS } from '../data/photos.ts'
import { AREAS, CITY, CLINICS, findSpecialist } from '../data/specialists.ts'
import useLgFocusFallback from '../hooks/useLgFocusFallback.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import ViewLayout from './ViewLayout.tsx'

type Target = { appointment: Appointment; trigger: HTMLButtonElement }

// Una cita del almacén como UI/Appointment Card: acciones por estado (diseño
// §4.7). «Agendar seguimiento» y «Agendar de nuevo» llevan al perfil.
function cardProps(appointment: Appointment, onCancel: (trigger: HTMLButtonElement) => void): AppointmentCardProps {
  const specialist = findSpecialist(appointment.slug)!
  const common = {
    when: `${dayTitle(parseDate(appointment.date))} · ${appointment.time}`,
    dateTime: `${appointment.date}T${appointment.time}`,
    name: specialist.name,
    specialty: AREAS[specialist.area],
    location: `${CLINICS[specialist.clinic].name} · ${CITY}`,
    initial: specialist.initial,
    photo: PHOTOS[specialist.slug],
  }
  if (appointment.status === 'confirmed') return { ...common, status: 'confirmed', rescheduleHref: `/mis-citas/${appointment.id}/reprogramar`, onCancel }
  if (appointment.status === 'pending') return { ...common, status: 'pending', pendingNote: PENDING_NOTE, onCancel }
  return { ...common, status: appointment.status, bookHref: `/especialistas/${specialist.slug}` }
}

// V4 · Mis citas (/mis-citas, D1; Figma 04.2, 04.5, 04.7, 04.8 y 04.9).
// Secciones, no pestañas (§5.4): Próximas y Pasadas, cada una una <section>
// con su h2 y una lista; las fechas son los h3 de las tarjetas. Con 0 citas
// próximas no hay sección Próximas (sin h2 vacío) y el subtítulo lo dice.
//
// Cancelar: un solo diálogo para toda la lista, que recibe el disparador para
// devolverle el foco al mantener. Al confirmar, el diálogo ya está cerrado
// (Dialog cierra antes de avisar) y, en el mismo manejador, la cita se cancela
// en el almacén (D13) y aparece el aviso «Cita cancelada», estado de la vista:
// un solo commit con la tarjeta en Pasadas y el aviso, y el foco en su título
// (Notice, efecto de layout). El aviso no cruza navegaciones.
//
// Desde lg, el aside «Agendar otra cita» (04.5): contenido complementario sin
// envío, después de las secciones en el DOM (panel 04.0). Por debajo de lg no
// existe (D7); si el foco estaba en su botón al cruzar, va al h1.
export default function MyAppointments() {
  const appointments = useAppointments()
  const isDesktop = useMediaQuery('lg')
  useLgFocusFallback(isDesktop)
  const [target, setTarget] = useState<Target | null>(null)
  const [notice, setNotice] = useState<{ id: string; body: string } | null>(null)
  const upcomingId = useId()
  const pastId = useId()
  const asideId = useId()

  const { upcoming, past } = groupAppointments(appointments)
  const copy = (appointment: Appointment) => cancelCopy(appointment, findSpecialist(appointment.slug)!)

  const card = (appointment: Appointment) => (
    <AppointmentCard key={appointment.id} {...cardProps(appointment, (trigger) => setTarget({ appointment, trigger }))} />
  )

  const confirmCancel = () => {
    if (!target) return
    const { appointment } = target
    appointmentStore.cancel(appointment.id)
    setNotice({ id: appointment.id, body: copy(appointment).notice })
    setTarget(null)
  }

  return (
    <ViewLayout title="Mis citas" current="mis-citas" bottomNav>
      <PageHeader title="Mis citas" subtitle={upcomingText(upcoming.length)} />

      <div className="c-my-appointments o-layout o-layout--aside-end">
        <div className="o-stack o-stack--gap-6">
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
            <section className="c-my-appointments__section" aria-labelledby={upcomingId}>
              <h2 className="c-my-appointments__title" id={upcomingId}>
                Próximas
              </h2>
              <ul className="o-stack o-stack--gap-4" role="list">
                {upcoming.map(card)}
              </ul>
            </section>
          )}

          <section className="c-my-appointments__section" aria-labelledby={pastId}>
            <h2 className="c-my-appointments__title" id={pastId}>
              Pasadas
            </h2>
            <ul className="o-stack o-stack--gap-4" role="list">
              {past.map(card)}
            </ul>
          </section>
        </div>

        {isDesktop && (
          <aside className="c-my-appointments__aside" aria-labelledby={asideId}>
            <div className="c-my-appointments__aside-text">
              <h2 className="c-my-appointments__aside-title" id={asideId}>
                Agendar otra cita
              </h2>
              <p className="c-my-appointments__aside-body">Busca un especialista y elige un horario libre.</p>
            </div>
            <Button href={PATHS.especialistas}>
              Buscar especialista
            </Button>
          </aside>
        )}
      </div>

      <Dialog
        open={target !== null}
        title="¿Cancelar esta cita?"
        body={target ? copy(target.appointment).dialog : undefined}
        dismissLabel="Mantener mi cita"
        confirmLabel="Cancelar cita"
        returnFocus={target?.trigger ?? null}
        onDismiss={() => setTarget(null)}
        onConfirm={confirmCancel}
      />
    </ViewLayout>
  )
}
