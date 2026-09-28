import { useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router'
import ActionBar from '../components/ActionBar.tsx'
import AppointmentSummary from '../components/AppointmentSummary.tsx'
import BackLink from '../components/BackLink.tsx'
import BookingSteps from '../components/BookingSteps.tsx'
import Breadcrumb from '../components/Breadcrumb.tsx'
import Button from '../components/Button.tsx'
import Checkbox from '../components/Checkbox.tsx'
import ErrorSummary, { type ErrorSummaryItem } from '../components/ErrorSummary.tsx'
import FieldSelect from '../components/FieldSelect.tsx'
import FieldText from '../components/FieldText.tsx'
import Legend from '../components/Legend.tsx'
import Link from '../components/Link.tsx'
import Notice from '../components/Notice.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { PATHS } from '../components/destinations.ts'
import { dayTitle, weekdayDay } from '../components/dates.ts'
import { BOOKING_DURATION, BOOKING_MODALITY, BOOKING_POLICY } from '../data/booking.ts'
import { TODAY } from '../data/clock.ts'
import { patientStore, submitBooking, validatePatient, type PatientDraft, type PatientError, type PatientField } from '../data/patient.ts'
import { PHOTOS } from '../data/photos.ts'
import { REASONS } from '../data/reasons.ts'
import { scenarioFrom } from '../data/scenario.ts'
import { carriedParams } from '../data/search.ts'
import { AREAS, CLINICS, shortName } from '../data/specialists.ts'
import useLgFocusFallback from '../hooks/useLgFocusFallback.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import type { bookingStepLoader } from './loaders.ts'
import ViewLayout from './ViewLayout.tsx'

const TITLE = 'Tus datos'
const REASON_OPTIONS = REASONS.map((reason) => ({ value: reason, label: reason }))

// Nombre del campo en el resumen de errores: la etiqueta, sin «(opcional)»,
// y el aviso por su nombre (Figma 03.2).
const SUMMARY_LABELS: Record<PatientField, string> = {
  nombre: 'Nombre completo',
  correo: 'Correo electrónico',
  telefono: 'Teléfono',
  motivo: 'Motivo de consulta',
  privacidad: 'Aviso de privacidad',
}

// V3 · Datos del paciente (/especialistas/:slug/datos, D1; Figma 03.1–03.6).
// La validación es al enviar (diseño §3.4; form noValidate): los errores solo
// cambian al enviar (opción A del plan). Con errores, el resumen encabeza el
// formulario y su h2 recibe el foco. Un envío válido reserva (D13) y va a la
// confirmación con replace; con ?escenario=ocupada falla (D8): aviso Error sin
// role, el foco en su título y el pie pasa a «Elegir otra hora». Los valores
// viven en el borrador de D17, que cruza vistas.
//
// La vista no se suscribe al borrador: lo lee una vez al montar y le escribe
// cada cambio. Suscrita, el reinicio que hace submitBooking tras una reserva
// correcta volvía a pintar el form vacío durante un frame antes del cambio de
// ruta (medido en pnpm verify 5.3, dev y preview).
//
// Una sola estructura de form en las dos plataformas (c-patient-form). Al
// cruzar lg cambian de control el retroceso, el pie (Action Bar o sección «Tu
// cita») y los pasos (D7): el foco que cae en body va al h1.
export default function PatientData() {
  const { specialist, date, time } = useLoaderData<typeof bookingStepLoader>()
  const { slug } = specialist
  const isDesktop = useMediaQuery('lg')
  useLgFocusFallback(isDesktop)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(() => patientStore.getSnapshot())
  const change = (update: Partial<PatientDraft>) => {
    setDraft((current) => ({ ...current, ...update }))
    patientStore.update(update)
  }

  const [errors, setErrors] = useState<PatientError[]>([])
  const [failed, setFailed] = useState(false)
  const focusSummary = useRef(false)
  const summaryHeading = useRef<HTMLHeadingElement>(null)

  const formId = useId()
  const noteId = useId()
  const helpId = useId()
  const summaryTitleId = useId()

  // En el mismo commit que monta o actualiza el resumen: foco en su h2 sin
  // desplazar, y el resumen al inicio de la vista (focus() centraría el
  // elemento en Chromium).
  useLayoutEffect(() => {
    if (!focusSummary.current) return
    focusSummary.current = false
    const heading = summaryHeading.current
    heading?.focus({ preventScroll: true })
    heading?.closest('.c-error-summary')?.scrollIntoView({ block: 'start' })
  })

  const carried = carriedParams(searchParams)
  const backHref = carried.size ? `/?${carried}` : '/'
  const selection = new URLSearchParams(carried)
  selection.set('fecha', date.toString())
  selection.set('hora', time)
  const profileHref = `/especialistas/${slug}?${selection}`
  const confirmHref = `/especialistas/${slug}/confirmar?${selection}`
  // «Elegir otra hora»: el perfil con el día y sin la hora, que ya no está libre.
  const retry = new URLSearchParams(carried)
  retry.set('fecha', date.toString())
  const retryHref = `/especialistas/${slug}?${retry}`
  const doctor = shortName(specialist)
  const clinic = CLINICS[specialist.clinic]

  const errorFor = (field: PatientField) => errors.find((error) => error.field === field)?.message
  const summaryItems: ErrorSummaryItem[] = errors.map((error) => ({ id: error.field, label: SUMMARY_LABELS[error.field] }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found = validatePatient(draft)
    setErrors(found)
    if (found.length) {
      focusSummary.current = true
      return
    }
    const result = submitBooking({ slug, date: date.toString(), time }, scenarioFrom(searchParams))
    if (result.ok) {
      navigate(`/citas/${result.id}/confirmada${carried.size ? `?${carried}` : ''}`, { replace: true })
      return
    }
    setFailed(true)
  }

  const retryButton = <Button href={retryHref}>Elegir otra hora</Button>

  const bar = isDesktop ? undefined : failed ? (
    <ActionBar>{retryButton}</ActionBar>
  ) : (
    <ActionBar note={`${dayTitle(date)}, ${time} · ${doctor}`} noteId={noteId}>
      <Button type="submit" form={formId} aria-describedby={noteId}>
        Confirmar cita
      </Button>
    </ActionBar>
  )

  return (
    <ViewLayout title={TITLE} current="especialistas" currentKind="section" bar={bar}>
      <PageHeader
        title={TITLE}
        back={
          isDesktop ? (
            <Breadcrumb
              levels={[
                { label: 'Especialistas', href: backHref },
                { label: doctor, href: profileHref },
              ]}
              current={TITLE}
            />
          ) : (
            <BackLink href={confirmHref} className="c-page-header__back">
              Tu cita
            </BackLink>
          )
        }
        steps={isDesktop ? undefined : <BookingSteps current={2} />}
      />

      <form id={formId} className="c-patient-form o-layout o-layout--aside-end" onSubmit={submit} noValidate>
        <div className="o-stack o-stack--gap-6">
          {failed ? (
            <Notice
              tone="error"
              delivery="focus"
              headingLevel={2}
              title="Esa hora ya está ocupada"
              body={`Alguien reservó el ${weekdayDay(date, TODAY)} a las ${time} mientras completabas tus datos. Tus datos se conservan.`}
            />
          ) : (
            summaryItems.length > 0 && <ErrorSummary items={summaryItems} headingRef={summaryHeading} />
          )}

          <div className="c-patient-form__card o-stack o-stack--gap-6">
            <fieldset className="o-stack o-stack--gap-1" aria-describedby={helpId}>
              <Legend level="section" headingLevel={2} helpId={helpId} help="Todos los campos son obligatorios salvo los marcados como opcionales">
                Datos del paciente
              </Legend>
              <div className="c-patient-form__fields">
                <FieldText
                  label="Nombre completo"
                  id="nombre"
                  name="nombre"
                  autoComplete="name"
                  required
                  placeholder="Nombre y apellidos"
                  value={draft.name}
                  onChange={(event) => change({ name: event.target.value })}
                  hint="Como aparece en tu identificación"
                  error={errorFor('nombre')}
                />
                <FieldText
                  label="Correo electrónico"
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nombre@ejemplo.com"
                  value={draft.email}
                  onChange={(event) => change({ email: event.target.value })}
                  hint="Te enviaremos el comprobante de la cita"
                  error={errorFor('correo')}
                />
                <FieldText
                  label="Teléfono (opcional)"
                  id="telefono"
                  name="telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="55 1234 5678"
                  value={draft.phone}
                  onChange={(event) => change({ phone: event.target.value })}
                  hint="10 dígitos. Te llamamos solo si hay un cambio"
                  error={errorFor('telefono')}
                />
                <FieldSelect
                  label="Motivo de consulta"
                  id="motivo"
                  name="motivo"
                  required
                  options={REASON_OPTIONS}
                  placeholder="Elige una opción"
                  value={draft.reason}
                  onChange={(event) => change({ reason: event.target.value })}
                  hint="Nos ayuda a preparar tu consulta"
                  error={errorFor('motivo')}
                />
              </div>
            </fieldset>

            <fieldset className="o-stack o-stack--gap-1">
              <Legend level="section" headingLevel={2}>
                Antes de confirmar
              </Legend>
              <Link href={PATHS.fueraDeAlcance} className="c-patient-form__link">
                Leer el aviso de privacidad
              </Link>
              <div className="c-patient-form__options o-stack o-stack--gap-0">
                <Checkbox
                  label="Acepto el aviso de privacidad"
                  id="privacidad"
                  name="privacidad"
                  required
                  checked={draft.privacy}
                  onChange={(event) => change({ privacy: event.target.checked })}
                  hint="Solo usamos tus datos para esta cita"
                  error={errorFor('privacidad')}
                />
                <Checkbox
                  label="Quiero un recordatorio por correo el día anterior"
                  id="recordatorio"
                  name="recordatorio"
                  checked={draft.reminder}
                  onChange={(event) => change({ reminder: event.target.checked })}
                  hint="Lo enviamos 24 horas antes de tu cita"
                />
              </div>
            </fieldset>
          </div>
        </div>

        {isDesktop && (
          <section className="c-booking-summary" aria-labelledby={summaryTitleId}>
            <BookingSteps current={2} />
            <AppointmentSummary
              title="Tu cita"
              titleId={summaryTitleId}
              variant="aside"
              name={specialist.name}
              specialty={AREAS[specialist.area]}
              initial={specialist.initial}
              photo={PHOTOS[slug]}
              modality={BOOKING_MODALITY}
              when={`${dayTitle(date)}, ${time}`}
              duration={BOOKING_DURATION}
              clinic={clinic}
            />
            <Notice tone="info" headingLevel={null} title="Antes de continuar" body={BOOKING_POLICY} />
            <div className="c-booking-summary__actions">
              {failed ? (
                retryButton
              ) : (
                <>
                  <Button type="submit" aria-describedby={noteId}>
                    Confirmar cita
                  </Button>
                  <p className="c-booking-summary__note" id={noteId}>
                    Recibirás un correo de confirmación
                  </p>
                </>
              )}
            </div>
          </section>
        )}
      </form>
    </ViewLayout>
  )
}
