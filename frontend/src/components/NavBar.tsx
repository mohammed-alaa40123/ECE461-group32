export default function NavBar(): JSX.Element {
  const navItems = ['Home', 'About', 'Contact', 'Blog', 'Documentation'];
  return (
    <div className="flex justify-end">
      <ul className="flex fixed gap-5 text-xl">
        {navItems.map((ele: string): JSX.Element => <li><a className="hover:text-gray-700 transition-all duration-200">{ele}</a></li>)}
      </ul>
    </div>
  );
}