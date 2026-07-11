-- Populate forum company logo_path with verified local assets in public/company-logos/.
-- Provenance and licensing notes: public/company-logos/SOURCES.md

update public.forum_companies
set logo_path = '/company-logos/apple.svg'
where slug = 'apple';

update public.forum_companies
set logo_path = '/company-logos/amazon.svg'
where slug = 'amazon';

update public.forum_companies
set logo_path = '/company-logos/microsoft.svg'
where slug = 'microsoft';

update public.forum_companies
set logo_path = '/company-logos/nvidia.svg'
where slug = 'nvidia';

update public.forum_companies
set logo_path = '/company-logos/meta.svg'
where slug = 'meta';

update public.forum_companies
set logo_path = '/company-logos/walmart.svg'
where slug = 'walmart';

update public.forum_companies
set logo_path = '/company-logos/coca-cola.svg'
where slug = 'coca-cola';

update public.forum_companies
set logo_path = '/company-logos/hm.svg'
where slug = 'hm';

update public.forum_companies
set logo_path = '/company-logos/volvo.svg'
where slug = 'volvo';

update public.forum_companies
set logo_path = '/company-logos/ericsson.svg'
where slug = 'ericsson';

update public.forum_companies
set logo_path = '/company-logos/investor.svg'
where slug = 'investor';
