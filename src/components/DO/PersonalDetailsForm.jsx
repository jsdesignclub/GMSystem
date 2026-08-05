import React, { useMemo } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { getTranslation } from '../../i18n';

const dsDivisions = {
  Badulla: [
    'Badulla', 'Bandarawela', 'Ella', 'Haldummulla', 'Hali-Ela',
    'Haputale', 'Kandaketiya', 'Lunugala', 'Mahiyanganaya',
    'Meegahakivula', 'Passara', 'Rideemaliyadda', 'Soranathota',
    'Uva Paranagama', 'Welimada'
  ],
  Monaragala: [
    'Badalkumbura', 'Bibile', 'Buttala', 'Kataragama', 'Madulla',
    'Medagama', 'Moneragala', 'Sevanagala', 'Siyambalanduwa',
    'Thanamalwila', 'Wellawaya'
  ]
};

const gsDivisionsData = {
  Badulla: ['Andeniya','Badulla Central','Badulla East','Badulla North','Badulla South','Badulla West','Badulupitiya','Damanwara','Glen Alpin','Hegoda','Hindagoda','Hingurugamuwa','Hinnarangolla','Ilukthenna','Kailagoda','Kanupelella','Katupelella','Kendagolla','Malangamuwa','Medapathana','Pitawelagama','Rambukpotha','Sirimalgoda','Thelbedda Estate','Udawela','Vineethagama','Viyadiguna','Welibissa','Wewessa'],
  Bandarawela: ['Ambadandegama','Ambegoda','Bambaragama','Bandarawela East','Bandarawela West','Beddearawa','Beddekumbura','Bindunuwewa','Creig Watta','Darahitawanagoda','Diganathenna','Dulgolla','Egodagama','Etthalapitiya','Gediyaroda','Icelab Watta','Inikambedda','Karagahawela','Kebillawela North','Kebillawela South','Kinigama','Kirioruwa','Konthahela','Liyangahawela','Liyangahawela Watta','Mahaulpatha','Makulella','Mathetilla','Nayabedda Estate','Obadella','Thanthiriya','Udaperuwa','Watagamuwa','Weheragalathenna','Wewathenna'],
  Ella: ['Ballaketuwa','Beddewela','Demodara','Dodamgolla','Dowa','Ella','Galtanhena','Gawarawela','Govussa','Halpe','Heeloya','Hettipola','Idamegama','Ilukpelessa','Karandagolla','Kirinda','Kithalella','Madhuragama','Medawela West','Millagama','Namunukula','Naulla','Nawela East','Nawela West','Newberg','Palleperuwa','Piyarapandowa','Pupula','Pupula West','Rawanaella','Udu Kumbalwela','Yahalewela'],
  Haldummulla: ['Akkaraseeya','Amilagama','Ampitiyathenna','Bambarapokuna','Beragala','Divulgasmulla','Gampaha','Haldummulla','Harankahawa','Kalupahana','Kelipanawela','Kirawanagama','Kithulgahaarawa','Kolongasthenna','Kosgama','Koslanda','Kotabakma','Lemasthota','Mahakanda','Mahalanda','Manthenna','Marangahawela','Medawela','Moraketiya','Nikapotha East','Nikapotha West','Poonagalla','Ranasinghegama','Ranwanguhawa','Seelathenna','Soragune','Uvathenna','Viharagala','Walhaputhenna','Watagamuwa','Weeliya','Weerakongama','Welanwita','Welibissa'],
  'Hali-Ela': ['Anthuduwawela','Beddegama','Bogahamaditta','Bogoda','Bulathwatta','Deegalla','Dehiwinna','Dematawelhinna','Dikwella','Etampitiya','Gawela','Godegama','Haliela','Hapuwalakumbura','Hethekma','Hinnaranagolla','Imbulgoda','Jangulla','Kandana','Katugaha','Ketawala','Kirinda','Kokatiyamaluwa','Kottagoda','Kudumahuwela','Kurukude','Landewela','Mahathenna','Mahawattagama','Maligathenna','Malitta','Medagama','Medapitigama','Morethota','Mugunumatha East','Mugunumatha West','Neludanda','Neluwa','Niliathugoda','Pahamunuthota','Pallegama','Panakanniya','Pattipola','Perahettiya','Samagipura','Springvalley','Springvalley Estate','Udagama','Udakohovila','Uduwara','Unagolla','Uva Mahawela','Warakadanda','Wegama','Welikemulla','Wepassawela','Wewelhinna'],
  Haputale: ['Aluthwela','Bingethenna','Dambethenna','Diyathalawa','Dodamwatta','Ellagama','Eranawela','Galkanda','Glananor Watta','Haputala Town','Haputhalegama','Hela Kadurugamuwa','Horadorowwa','Jayaminipura','Kahagolla','Kahathewela','Kolathenna','Magiripura','Pahala Kadurugamuwa','Panketiya','Pitarathamale','Ranjallawa','Thotalagala','Umankandura','Viharakele','Welanhinna'],
  Kandaketiya: ['Badulluoya West','Baduluoya East','Beramada','Bogahakumbura','Bokanoruwa','Bopitiya','Dikkumbura','Galauda','Godunna','Hapathgamuwa','Hevandana','Kandakepu Ulpotha','Kandaketiya','Kirivehera','Kivulegedara','Mahakele','Mahathenna','Maliyadda','Mudagamuwa','Narangala','Pallewela','Thalakumbura','Thetilla','Wasanagama','Welaoya','Wewathenna'],
  Lunugala: ['Alakolagala','Arawakumbura','Attanagolla','Batawatta','Ekiriya','Gallulla','Galwelagama','Hopton','Janathapura','Janathapura North','Janathapura South','Kottalbedda','Lunugala Town','Madulsima','Maduwatta','Mahadowa','Metigahathenna','Millabedda','Pallekiruwa','Peessagama','Rendapola','Sooriyagoda','Sumudugama','Udakiruwa','Udapanguwa','Weragoda','Wewabedda','Yapamma'],
  Mahiyanganaya: ['Aluttarama','Aluyatawala','Bathalayaya','Belaganwewa','Beligalla','Dambagolla','Dambana','Dambarawa','Dehigolla','Divulapelessa','Elewela','Galporuyaya','Ginnoruwa','Girandurukotte','Haddattawa','Hebarawa','Hobariyawa','Kukulapola','Mahiyangana Town','Mapakadawewa','Medayaya','Meegahahena','Millattawa','Pahala Rathkinda','Pangaragammana','Poojanagaraya','Rotalawela','Senanigama','Sorabora','Thalangamuwa','Theldeniyaya','Ulhitiya','Wewatta','Wewgampaha','Wiranegama'],
  Meegahakivula: ['Aggalaulpotha','Akurukaduwa','Balagolla','Ellanda','Hunuketapitiya','Kalugahakandura','Karametiya','Karandagahamada','Ketawatta','Kohana','Komarika','Meegahakivula','Morahela','Pitamaruwa','Polgahaarawa','Polwatta','Roberiya','Thaldena','Watagommana','Wewathenna'],
  Passara: ['Ambathenna','Ambathenna West','Bibilegama East','Bibilegama West','Dambakote','Dambewela','Demodara','Gerandiella','Gonagala East','Gonagala West','Kahataruppa','Kanahela','Kanawerella','Kanawerella East','Kanawerella West','Kudugala Pathana','Madugasthalawa North','Madugasthalawa South','Maligathenna','Maussagolla East','Maussagolla West','Medawelagama','Meedumpitiya','Meeriyabedda','Nikebedda','Palagolla','Palawatta','Pallegama','Paramahankada','Passara Town East','Passara Town North','Passara Town South','Pelgahathenna','Puhulwatta','Supuroda','Thalagahagedara','Thennuge','Tholabolawatta','Udagama','Welgolla','Wewekele'],
  Rideemaliyadda: ['Abhayapura','Aluketiyawa','Andaulapatha','Aralupitiya','Arawa','Arawatta','Bubula','Deekirigolla','Dehigama','Dikkendayaya','Dikyaya','Diyakombala','Ekiriyankumbura','Gamakumbura North','Gamakumbura South','Ikiriyagoda','Kandegama','Kandubedda','Keselpotha North','Keselpotha South','Kooralewela','Kotathalawa','Kudalunuka','Kuruvithenna','Mahagama','Mahalunuka','Morana','Nagadeepa','Orubendiwewa','Pahalaoyagama','Pethiyagoda','Pinnagolla','Rideemaliyadda North','Rideemaliyadda South','Ritigahaarawa','Sangabopura','Senewigama','Serana','Uraniya','Uva Gemunupura','Uva Thissapura','Welampele'],
  Soranathota: ['Ambagasdowa','Angoda','Boliyadda','Budugekanda','Dikpitiya','Egodawela','Idamegama','Idamepanguwa','Kandegedara Town','Ketakellagama','Kirioruwa','Kithulwattagama','Kohowila','Kosgolla','Kuttiyagolla','Ledger Watta','Moragolla','Pallekanda','Pathanegedara','Pussellakanda','Pussellawa','Rideepana','Soranathota','Wattekele','Yatilellagama'],
  'Uva Paranagama': ['Alagolla','Ambagasdowa','Balagala','Bambarapana','Beraliyapola','Busdulla','Dangamuwa','Daragala','Dimbulana','Downside','Ellanda','Ethkandawaka','Galahagama','Gampaha','Hangiliella','Hangunnawa','Hathkinda','Idamegama','Ilukwela','Karagahaulpatha','Kendagolla','Kerklis','Ketagoda','Kindigoda','Kirawanagama','Kodakumbura','Kohilegama','Korandekumbura','Kotawara Udagama','Kotawera Pahalagama','Kumarapattiya','Kurundugolla','Lunuwatta','Malapolagama','Malwatte Gama','Maspanna','Medagoda Gama','Medawela','Medipokuna','Metiwalalanda','Mudanawa','Pallewela','Panagoda','Pannalagama','Pannalawela','Paranagama','Perawella','Pitiyakumbura','Rahupola','Ranhawadi Gama','Rathamba','Ritikumbura','Sapugolla','Thawalampola','Thelhawadigama','Thuppitiya','Udaperuwa','Uduhawara','Ulugala','Uma Ela','Unapana','Vondmar','Welamedagama','Weliulla','Wethalawa','Wewegama','Yahala Arawa','Yalagamuwa'],
  Welimada: ['Alakolagala','Alawathugoda','Alugolla','Ambagahakumbura','Ambewela','Bibiligamuwa','Bogahakumbura','Boragas','Boralanda','Dambawenna','Dayabarawatta','Dikkapitiya','Dimuthugama','Divithotawela','Divurumgama','Erabadda','Galedanda','Gavarammana','Girambe','Guruthalawa','Helayalkumbura','Hewanakumbura','Himbiliyagolla','Hingurugamuwa','Hinnarangolla','Hulankapolla','Idamegama','Kabillegama','Kalubululanda','Kandepuhulpola','Karagasthenna','Keppetipola','Ketakella','Koskanuwegama','Kotakithula','Landegama','Mahathenna','Maligathenna','Malpotha','Mawithikumbura','Medagedaragama','Merahawatta','Nawela','Nedungamuwa','Ohiya','Ohiya Watta','Pahala Yalkumbura','Palugama Ella','Palugama Town','Pitapola','Puhulpola','Puranwela','Rahangala','Rathkarawwa','Silmiyapura','Thennakonwela','Udakandagolla','Udupeella','Vidurupola','Wangiyakumbura','Welikadagama','Welimada Town','Welimadawatta','Yalpathwela'],
  Badalkumbura: ['Alupotha','Ankada','Athala','Badalkumbura','Bogahapelessa','Dambagahawela','Dewathura','Ella','Ethpattiya','Ettalamulla','Gadavila','Hingurukaduwa','Kalagahakivula','Karandagama','Karavila','Katugahagalge','Keliwessa','Kotamuduna','Lunugala Colony','Madamagama','Madugahapattiya','Madugasmulla','Madukotan Arawa','Mailagasthenna','Maiyokka Watta','Maligathenna','Meegahayaya','Miyanakandura','Moratuwagama','Muthukeliyawa','Naranwatta','Pallegama','Punsisigama','Pussellawa','Ranugalla','Thalawagama','Therappahuwa','Waradola','Wasipaha','Wekumbura','Yakurawa'],
  Bibile: ['Ambagolla','Ambelanda','Badulla gammana','Bibila','Bokagonna','Bulupitiya','Dehiattawela','Dodamgolla','Egoda kotagama','Ethanawatta','Hamapola','Hewelwela','Kanawegalla','Kanulwela','Karagahawela East','Karagahawela West','Karandugala','Kawdella','Kehelattawela','Kokunnawa','Kotagama','Kuruwamba','Lindakumbura','Mallahawa','Medipitiya','Moodiyala','Morattamulla','Nagala','Nilgala','Pitakumbura','Radaliyadda','Rathupaskatiya','Thanayamgama','Thotillaketiya','Udamallahawa','Urawula','Ussagala','Wegama','Wegama South','Yalkumbura'],
  Buttala: ['Buruthagolla','Dikyaya','Galtemmandiya','Gaminipura','Gonagan Ara','Horabokka','Konketiya','Kukurampola','Kumaragama','Kumarapura','Mahagodayaya','Mahasenpura','Maligavila','Medagama','Minipuragama','Okkampitiya','Pahalagama','Pelwatta','Pettagamwela','Puhulkotuwa','Rahathangama','Uda Arawa','Udagama','Ulugala','Unawatuna','Veheragala','Waguruwela','Yatiyallathota','Yudaganawa'],
  Kataragama: ['Detagamuwa','Kandasurindugama','Karavile','Kataragama','Sella Kataragama'],
  Madulla: ['Alpitiya','Alugalge','Aratugaswela','Baduluwela','Bandarawadiya','Dambagalla','Deliwa','Ellekona','Galbokka','Galgamuwa','Gangoda Arawa','Gangodagama','Gonathalawa','Iginiyagala','Ihawa','Iluklanda','Kahagolla','Kolladeniya','Kottagala','Magandana','Magandaoya Colony','Makulla','Mariarawa','Mullegama','Namaloya Colony','Neelawa Bedda','Nelliyadda','Obbegoda','Pagura','Panguwa','Polgahagama','Ritigahawatta','Ruwalwela','Thalkotayaya','Thampalawela','Therela','Udumulla','Watawanagama'],
  Medagama: ['Alana','Amunekandura','Bakinigahawela','Bendiyawa','Bibilamulla','Dahagoniya','Dahamgama','Diviyapola','Elhena','Ellekoona','Godigamuwa','Ilukkumbura','Iwela','Kalugahawadiya','Keenagoda','Kendawinna','Kinnaraboowa','Kohukumbura','Koongolla','Kotabowa','Medagama','Mellagama','Monarawana','Nannapurawa','Nugamura','Pitadeniya','Polgahapitiya','Pothubandana','Pubbara','Raththanadeniaya','Senapathiya','Senpathigama','Thambana','Thimbiriya','Yakunnawa'],
  Moneragala: ['Aliyawatta','Batugammana','Bohitiya','Debeddekivla','Guruhela','Hidikiwla','Horombuwa','Hulandawa','Hulandawa Left','Hulandawa South','Kahambana','Kawdawa','Kolonvinna','Kumbukkana','Maduruketiya','Magandanamulla','Marawa','Monaragala','Muppane','Nakkala','Rathnapitiya','Tenwatta','Thenagallanda','Veheragala','Viharamulla','Weliyaya'],
  Sevanagala: ['Bahirawa','Habaraluwewa','Habarattawela','Habarugala','Indikolapelessa','Katupilagama','Kiriibbanwewa','Mahagama','Muthuminigama','Nugegalayaya','Punchiwewa','Samagipura','Sevanagala','Weliara'],
  Siyambalanduwa: ['Ambagahapitiya','Barawaya','Beraliyapola','Buddama','Dombagahawela','Ethimale','Ethimale Colony','Galamuna','Gemunupura','Govindupura','Guruhela','Helamulla','Indigasella','Kalugollayaya','Karambagoda','Kimbulawela','Kivuleyaya','Kodayana','Kooragammana','Kotagoda','Kotiyagala','Kotiyagoda','Liyangolla','Madugama','Maha Kalugolla','Manabarana','Meeyagala','Minipura','Muthukandiya','Nape','Newgala','Nugagaha Kivula','Pahatha Arawa','Pallegama','Pallewela','Parakumpura','Ruhunu Danawwa','Samanala Bedda','Siripura','Siyambalanduwa','Sri Wijithapura','Thissapura','Vilaoya','Waragama','Wattegama','Weragoda','Wijayapura','Yakkandurawa'],
  Thanamalwila: ['Aluthwewa','Bodagama','Hambegamuwa','Hambegamuwa Colony','Kahakurullan Pelessa','Kandiyapitawewa','Kivul Ara','Kotaweheramankada','Mahawewa','Nikawewa','Sienukkuwa','Sittarama','Suriya Ara','Usgala'],
  Wellawaya: ['Anapallama','Andawelayaya','Balaharuwa','Buduruwagala','Debara Ara','Dimbulamure','Ethiliwewa','Gallbokka','Handapanagala','Kithulkote','Kotikanbokka','Kurugama','Maha Aragama','Neluwagala','Nugayaya','Pubuduwewa','Randenigodayaya','Randeniya','Siripuragama','Siyambalagunaya','Sudupanawela','Thelulla','Thelulla Colony','Uva Kudaoya','Veherayaya','Veherayaya Colony','Warunagama','Wellawaya','Yalabowa']
};

function PersonalDetailsForm({ data, onUpdate, onNext, language = 'en' }) {
  const dsDivisionsForDistrict = useMemo(() => dsDivisions[data.district] || [], [data.district]);
  const gsDivisions = useMemo(() => gsDivisionsData[data.dsDivision] || [], [data.dsDivision]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { ...data, [name]: value };
    if (name === 'district') {
      updates.dsDivision = '';
      updates.gsDivision = '';
    }
    if (name === 'dsDivision') {
      updates.gsDivision = '';
    }
    onUpdate(updates);
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        gap: '1rem'
      }}>
        <div style={{ minWidth: '200px', flex: '1' }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>{getTranslation('application.personal.title', language)}</h2>
          <p style={{ color: '#64748b', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{getTranslation('application.personal.subtitle', language)}</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input 
            type="text" 
            placeholder={getTranslation('application.personal.quickLookup', language)} 
            style={{ 
              padding: '0.6rem 1rem 0.6rem 2.5rem', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '20px',
              color: '#fff',
              fontSize: '0.85rem',
              width: '100%'
            }} 
          />
        </div>
      </div>

      <div 
        className="grid-2"
        style={{
          marginTop: '1.5rem'
        }}
      >
        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.fullName', language)}</label>
          <input type="text" name="fullName" value={data.fullName || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.fullNamePlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.nic', language)}</label>
          <input type="text" name="nic" value={data.nic || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.nicPlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.dob', language)}</label>
          <input type="date" name="dob" value={data.dob || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.gender', language)}</label>
          <select name="gender" value={data.gender || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.personal.selectGender', language)}</option>
            <option value="male">{getTranslation('application.personal.male', language)}</option>
            <option value="female">{getTranslation('application.personal.female', language)}</option>
            <option value="other">{getTranslation('application.personal.other', language)}</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.phone', language)}</label>
          <input type="text" name="phone" value={data.phone || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.phonePlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.whatsapp', language)}</label>
          <input type="text" name="whatsapp" value={data.whatsapp || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.phonePlaceholder', language)} />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{getTranslation('application.personal.address', language)}</label>
          <textarea name="address" value={data.address || ''} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder={getTranslation('application.personal.addressPlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.district', language)}</label>
          <select name="district" value={data.district || 'Badulla'} onChange={handleChange} style={inputStyle}>
            <option value="Badulla">Badulla</option>
            <option value="Monaragala">Monaragala</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.dsDivision', language)}</label>
          <select name="dsDivision" value={data.dsDivision || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.personal.selectDsDivision', language)}</option>
            {dsDivisionsForDistrict.map(ds => (
              <option key={ds} value={ds}>{ds}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.gsDivision', language)}</label>
          <select name="gsDivision" value={data.gsDivision || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.personal.selectGsDivision', language)}</option>
            {gsDivisions.map(gs => (
              <option key={gs} value={gs}>{gs}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.maritalStatus', language)}</label>
          <select name="maritalStatus" value={data.maritalStatus || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.personal.selectStatus', language)}</option>
            <option value="single">{getTranslation('application.personal.single', language)}</option>
            <option value="married">{getTranslation('application.personal.married', language)}</option>
            <option value="widowed">{getTranslation('application.personal.widowed', language)}</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.specialConsiderations', language)}</label>
          <select name="specialConsideration" value={data.specialConsideration || 'none'} onChange={handleChange} style={inputStyle}>
            <option value="none">{getTranslation('application.personal.none', language)}</option>
            <option value="disabled">{getTranslation('application.personal.disabled', language)}</option>
            <option value="widow">{getTranslation('application.personal.widow', language)}</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.dependants', language)}</label>
          <input type="number" name="dependants" value={data.dependants || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{getTranslation('application.personal.govService', language)}</label>
          <select name="govService" value={data.govService || 'no'} onChange={handleChange} style={inputStyle}>
            <option value="no">{getTranslation('application.personal.no', language)}</option>
            <option value="yes">{getTranslation('application.personal.yes', language)}</option>
          </select>
        </div>

        {data.govService === 'yes' && (
          <>
            <div className="form-group">
              <label style={labelStyle}>{getTranslation('application.personal.institutionName', language)}</label>
              <input type="text" name="govInstitution" value={data.govInstitution || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.institutionPlaceholder', language)} />
            </div>
            <div className="form-group">
              <label style={labelStyle}>{getTranslation('application.personal.positionHeld', language)}</label>
              <input type="text" name="govPosition" value={data.govPosition || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.positionPlaceholder', language)} />
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button 
          onClick={onNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            width: window.innerWidth < 768 ? '100%' : 'auto'
          }}
        >
          {getTranslation('application.personal.next', language)}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.025em'
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
};

export default PersonalDetailsForm;
