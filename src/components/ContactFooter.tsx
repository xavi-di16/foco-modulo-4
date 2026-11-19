import { Github, Instagram, Mail } from 'lucide-react';

const contactLinks = [
    {
        label: 'Instagram · @el_xavi_ok',
        href: 'https://www.instagram.com/el_xavi_ok/',
        icon: Instagram,
        external: true,
    },
    {
        label: 'GitHub · xavi-di16',
        href: 'https://github.com/xavi-di16',
        icon: Github,
        external: true,
    },
    {
        label: 'Correo · xadilorenzo@gmail.com',
        href: 'mailto:xadilorenzo@gmail.com',
        icon: Mail,
        external: false,
    },
] as const;

export function ContactFooter() {
    return (
        <footer className="contact-footer" aria-label="Contacto">
            <h2 className="contact-footer-title">Contacto</h2>
            <ul className="contact-footer-list">
                {contactLinks.map(({ label, href, icon: Icon, external }) => (
                    <li key={href}>
                        <a
                            href={href}
                            className="contact-footer-link"
                            {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                        >
                            <Icon size={16} aria-hidden="true" />
                            <span>{label}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </footer>
    );
}
