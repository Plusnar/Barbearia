# Como a Equipe Acessa o Banco de Dados

## PASSO 1: INSTALAR XAMPP (Uma única vez)
1. Baixe: https://www.apachefriends.org/
2. Execute o instalador
3. Clique Next > Next > Install

## PASSO 2: BAIXAR CERTIFICADO (Uma única vez)
1. Acesse: https://tidbcloud-prod-cluster-ca.s3.amazonaws.com/ca.pem
2. Salve em: `C:\xampp\php\extras\ssl\ca.pem`

## PASSO 3: CONFIGURAR PHPMYADMIN (Uma única vez)
1. Abra: `C:\xampp\phpMyAdmin\config.inc.php`
2. Procure por `$i = 0;` (linha ~20)
3. Logo depois dessa linha, adicione:
```php
$i++;
$cfg['Servers'][$i]['host'] = 'gateway01.us-east-1.prod.awstidclouddb.com';
$cfg['Servers'][$i]['port'] = 4000;
$cfg['Servers'][$i]['user'] = '3YC71VMTZLLsoRE.root';
$cfg['Servers'][$i]['password'] = '0c2xmx62M22chFCG';
$cfg['Servers'][$i]['auth_type'] = 'config';
$cfg['Servers'][$i]['ssl'] = true;
$cfg['Servers'][$i]['ssl_ca'] = 'C:/xampp/php/extras/ssl/ca.pem';
```

## PASSO 4: USAR TODOS OS DIAS
1. Abra XAMPP Control Panel
2. Clique em **Start** (Apache não precisa estar ligado, mas não faz mal)
3. Abra navegador: **http://localhost/phpmyadmin**
4. Pronto! Está no banco de dados `barbearia`
