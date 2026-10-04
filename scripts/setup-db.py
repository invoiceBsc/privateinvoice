import os,re,subprocess,shutil,pathlib
base=pathlib.Path(__file__).resolve().parent.parent;jail=base/'data/db-root';native=base/'node_modules/@embedded-postgres/linux-x64/native'
# Do not overwrite mapped libraries of an already-running project database.
pidfile=jail/'data/postgres/postmaster.pid'
if pidfile.exists():
 pid=int(pidfile.read_text().splitlines()[0])
 try:
  executable=pathlib.Path(os.readlink(f'/proc/{pid}/exe'))
 except (FileNotFoundError,ProcessLookupError):
  executable=None
 if executable is not None:
  if executable != jail/'pgsql/bin/postgres':
   raise RuntimeError('Database PID belongs to another executable; refusing setup')
  import socket,sys
  with socket.create_connection(('127.0.0.1',55432),timeout=5):pass
  print('Invoice database already running')
  sys.exit(0)
jail.mkdir(parents=True,exist_ok=True)
if not (jail/'pgsql').exists():shutil.copytree(native,jail/'pgsql',symlinks=False)
def libs(binary):
 out=subprocess.check_output(['ldd',str(binary)],text=True)
 for path in re.findall(r'(/[^\s()]+)',out):
  source=pathlib.Path(path)
  if source.is_file() and not str(source).startswith(str(native)):
   target=jail/str(source).lstrip('/');target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
for binary in ['postgres','initdb','pg_ctl']:libs(native/'bin'/binary)
(jail/'bin').mkdir(exist_ok=True);shutil.copy2('/bin/dash',jail/'bin/sh');libs('/bin/dash')
(jail/'etc').mkdir(exist_ok=True);(jail/'etc/passwd').write_text('invoice:x:65534:65534:Invoice database:/data:/bin/sh\n');(jail/'etc/group').write_text('invoice:x:65534:\n')
for name in ['data','tmp','dev']:(jail/name).mkdir(exist_ok=True)
os.chown(jail/'data',65534,65534);os.chmod(jail/'tmp',0o1777)
import stat
for name,major,minor in [('null',1,3),('urandom',1,9),('random',1,8)]:
 p=jail/'dev'/name
 if not p.exists():os.mknod(p,stat.S_IFCHR|0o666,os.makedev(major,minor));os.chmod(p,0o666)
for lib in (native/'lib').iterdir():
 if lib.is_file():shutil.copy2(lib,jail/'lib/x86_64-linux-gnu'/lib.name)
password=(base/'data/db-password').read_text();pw=jail/'data/password';pw.write_text(password);os.chown(pw,65534,65534);os.chmod(pw,0o600)
def run(args):subprocess.run(['chroot','--userspec=65534:65534',str(jail)]+args,check=True,cwd=str(base))
if not (jail/'data/postgres/PG_VERSION').exists():run(['/pgsql/bin/initdb','-D','/data/postgres','-U','invoice','--pwfile=/data/password','--auth-host=scram-sha-256','--auth-local=trust','--no-locale','--encoding=UTF8'])
config=jail/'data/postgres/postgresql.conf'
if '# Invoice isolated settings' not in config.read_text():
 with config.open('a') as f:f.write("\n# Invoice isolated settings\nlisten_addresses = '127.0.0.1'\nport = 55432\nunix_socket_directories = '/tmp'\nshared_buffers = '32MB'\nmax_connections = 20\n")
run(['/pgsql/bin/pg_ctl','-D','/data/postgres','-l','/data/postgres.log','-w','start'])
pw.unlink()
