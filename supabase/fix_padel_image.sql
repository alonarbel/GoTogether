-- Fix the padel card image (LoremFlickr 500s on the niche "padel" tag → use tennis)
update public.card_images
  set url = 'https://loremflickr.com/1200/800/tennis?lock=54856'
  where card_id = 'fa6c4944-090d-41de-bbd2-7ff2117cb482';
