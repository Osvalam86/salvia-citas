import AppLayout, { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import AppointmentCard, { type AppointmentCardProps } from '../components/AppointmentCard.tsx'
import BackLink from '../components/BackLink.tsx'

// Catálogo de 4.7 Citas y diálogos (D9). Página propia, como /kit/resultados:
// sus botones, etiquetas y avatares no entran en las medidas de /kit.
//
// Datos: las cinco citas de Karla (diseño §6) con la copia de las instancias
// de Figma 04.2 y 04.5, sin fotos (su origen está pendiente, DESIGN.md). La
// estructura es la de Mis citas: una sección por grupo, con h2 y una lista.
// El almacén real (D13) llega con la fase 5.

const PENDING_NOTE = 'El consultorio confirma en menos de 24 horas. Te avisaremos por correo.'

const UPCOMING: AppointmentCardProps[] = [
  {
    status: 'confirmed',
    when: 'Martes 24 de abril · 10:30',
    dateTime: '2029-04-24T10:30',
    name: 'Dra. Elena Ruiz Arellano',
    specialty: 'Cardiología',
    location: 'Clínica Roma Norte · Ciudad de México',
    initial: 'E',
    rescheduleHref: '/mis-citas/ruiz-2029-04-24/reprogramar',
    onCancel: () => {},
  },
  {
    status: 'pending',
    when: 'Martes 8 de mayo · 17:00',
    dateTime: '2029-05-08T17:00',
    name: 'Dr. Andrés Molina Paz',
    specialty: 'Dermatología',
    location: 'Consultorio Del Valle · Ciudad de México',
    initial: 'A',
    pendingNote: PENDING_NOTE,
    onCancel: () => {},
  },
  {
    status: 'confirmed',
    when: 'Miércoles 16 de mayo · 09:30',
    dateTime: '2029-05-16T09:30',
    name: 'Dr. Iván Cortés Naranjo',
    specialty: 'Oftalmología',
    location: 'Clínica Polanco · Ciudad de México',
    initial: 'I',
    rescheduleHref: '/mis-citas/cortes-2029-05-16/reprogramar',
    onCancel: () => {},
  },
]

const PAST: AppointmentCardProps[] = [
  {
    status: 'past',
    when: 'Lunes 12 de marzo · 09:00',
    dateTime: '2029-03-12T09:00',
    name: 'Dr. Tomás Ibarra Solís',
    specialty: 'Medicina general',
    location: 'Clínica Roma Norte · Ciudad de México',
    initial: 'T',
    bookHref: '/especialistas/tomas-ibarra-solis',
  },
  {
    status: 'cancelled',
    when: 'Jueves 22 de febrero · 12:30',
    dateTime: '2029-02-22T12:30',
    name: 'Dra. Paula Serrano Vidal',
    specialty: 'Nutrición clínica',
    location: 'Consultorio Nápoles · Ciudad de México',
    initial: 'P',
    bookHref: '/especialistas/paula-serrano-vidal',
  },
]

export default function KitAppointments() {
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
            defecto; Row cuando el li alcanza 40rem.
          </p>
        </div>

        <section className="c-kit__section" aria-labelledby="kit-proximas-titulo">
          <h2 className="c-kit__heading" id="kit-proximas-titulo">
            Próximas
          </h2>
          <ul className="o-stack o-stack--gap-4" role="list" id="kit-proximas">
            {UPCOMING.map((appointment) => (
              <AppointmentCard {...appointment} key={appointment.dateTime} />
            ))}
          </ul>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-pasadas-titulo">
          <h2 className="c-kit__heading" id="kit-pasadas-titulo">
            Pasadas
          </h2>
          <ul className="o-stack o-stack--gap-4" role="list" id="kit-pasadas">
            {PAST.map((appointment) => (
              <AppointmentCard {...appointment} key={appointment.dateTime} />
            ))}
          </ul>
        </section>
      </div>
    </AppLayout>
  )
}
