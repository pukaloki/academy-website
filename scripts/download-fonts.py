import re, urllib.request, pathlib
css=pathlib.Path('/tmp/phoenix-woff2.css').read_text()
output=[]
seen={}
for subset,block in re.findall(r'/\* ([^*]+) \*/\s*(@font-face\s*\{[^}]+\})',css):
 if subset not in ['latin','latin-ext']: continue
 family=re.search(r"font-family: '([^']+)'",block).group(1)
 weight=re.search(r'font-weight: (\d+)',block).group(1)
 url=re.search(r'url\(([^)]+)\)',block).group(1)
 if url not in seen:
  name=family.lower().replace(' ','-')+'-'+subset+'.woff2'
  if name in seen.values():name=family.lower().replace(' ','-')+'-'+subset+'-'+weight+'.woff2'
  urllib.request.urlretrieve(url,'public/assets/'+name)
  seen[url]=name
 output.append(block.replace(url,'/assets/'+seen[url]))
pathlib.Path('public/fonts.css').write_text('\n'.join(output))
pathlib.Path('licenses').mkdir(exist_ok=True)
for font in ['bricolagegrotesque','instrumentserif','inter','jetbrainsmono']:
 urllib.request.urlretrieve('https://raw.githubusercontent.com/google/fonts/main/ofl/'+font+'/OFL.txt','licenses/'+font+'-OFL.txt')
print('Bundled',len(seen),'WOFF2 files and four font licenses.')
