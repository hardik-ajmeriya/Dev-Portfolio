Put your screenshots of hardikajmeriya.com in this folder, then run:

    python scripts/make-site-shots.py

Name them so they sort in upload order — the filename becomes the caption:

    01-homepage-hero.png       ->  "Homepage hero"
    02-selected-work.png       ->  "Selected work"
    03-services.png            ->  "Services"
    04-contact-form.png        ->  "Contact form"
    05-mobile.png              ->  "Mobile"          (portrait = phone frame)
    06-admin-dashboard.png     ->  "Admin dashboard"

Seed the admin panel before capturing it:  npm run seed:local
Never screenshot real enquiries — those are other people's contact details.

Full instructions are at the top of scripts/make-site-shots.py
