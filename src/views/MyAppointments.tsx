import { parseDate } from '@internationalized/date'
import { useId, useState } from 'react'
import { useLoaderData, useLocation } from 'react-router'
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
  rescheduledText,
  upcomingText,
  useAppointments,
  type Appointment,
} from '../data/appointments.ts'
import { PHOTOS } from '../data/photos.ts'
import { AREAS, CITY, CLINICS, findSpecialist } from '../data/specialists.ts'
import useFocusFallback from '../hooks/useFocusFallback.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import type { myAppointmentsLoader } from './loaders.ts'
import ViewLayout from './ViewLayout.tsx'

type Target = { appointment: Appointment; trigger: HTMLButtonElement }

/** Título del aviso: destino del foco al volver de reprogramar (location.state.focus, D12). */
export const NOTICE_TITLE_ID = 'aviso'

/** Aviso de la vista. La key lleva el tipo: reprogramar c3 y después cancelarla da otro aviso. */
type ViewNotice = { key: string; title: string; body: string }

/** El aviso con el que nace esta entrada del historial: el que el loader tomó del almacén, o ninguno. */
type NoticeState = { entry: string; notice: ViewNotice | null }

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
// (Notice, efecto de layout).
//
// «Cita reprogramada» (diseño §7.2): el aviso que cruza la navegación desde la
// reprogramación vive en el almacén y lo consume el loader (D13). La vista
// nace con él y el foco llega a su título en el primer commit (Notice) y por
// location.state.focus (useRouteFocus). Un solo aviso a la vez, en el mismo
// sitio que «Cita cancelada», con la key `${tipo}-${id}`.
//
// Cada entrada del historial tiene su aviso: al cambiar de entrada con el
// mismo pathname (Atrás o Adelante entre dos entradas de Mis citas, o un PUSH
// a /mis-citas desde /mis-citas) la vista no se vuelve a montar, así que el
// estado se reinicia en el render al aviso del loader, que en esa pasada ya es
// ninguno. Si el título del aviso tenía el foco, cae en body y
// useFocusFallback lo lleva al h1 en el mismo commit.
//
// Desde lg, el aside «Agendar otra cita» (04.5): contenido complementario sin
// envío, después de las secciones en el DOM (panel 04.0). Por debajo de lg no
// existe (D7); si el foco estaba en su botón al cruzar, va al h1.
export default function MyAppointments() {
  const appointments = useAppointments()
  const { notice: arrived } = useLoaderData<typeof myAppointmentsLoader>()
  const { key: entry } = useLocation()
  const isDesktop = useMediaQuery('lg')
  useFocusFallback(isDesktop)
  const [target, setTarget] = useState<Target | null>(null)

  const rescheduled = arrived && appointments.find((a) => a.id === arrived.id)
  const fromLoader: ViewNotice | null = rescheduled
    ? { key: `${arrived.kind}-${arrived.id}`, title: 'Cita reprogramada', body: rescheduledText(rescheduled) }
    : null
  const [state, setState] = useState<NoticeState>({ entry, notice: fromLoader })
  if (state.entry !== entry) setState({ entry, notice: fromLoader })
  const { notice } = state
  const setNotice = (next: ViewNotice | null) => setState({ entry, notice: next })
  useFocusFallback(notice?.key ?? null)

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
    setNotice({ key: `cancelada-${appointment.id}`, title: 'Cita cancelada', body: copy(appointment).notice })
    setTarget(null)
  }

  return (
    <ViewLayout title="Mis citas" current="mis-citas" bottomNav>
      <PageHeader title="Mis citas" subtitle={upcomingText(upcoming.length)} />

      <div className="c-my-appointments o-layout o-layout--aside-end">
        <div className="o-stack o-stack--gap-6">
          {notice && (
            <Notice
              key={notice.key}
              tone="success"
              delivery="focus"
              headingLevel={2}
              title={notice.title}
              titleId={NOTICE_TITLE_ID}
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
